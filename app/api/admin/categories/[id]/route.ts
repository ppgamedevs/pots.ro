import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { categories, products, users } from '@/db/schema/core';
import { and, count, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth-helpers';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

async function assertAdminOrSupport(): Promise<
  | { ok: true; actor: { id: string; role: string } }
  | { ok: false; res: NextResponse }
> {
  const userId = await getUserId();
  if (!userId) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user || (user.role !== 'admin' && user.role !== 'support')) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, actor: { id: userId, role: user.role } };
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
  }

  const id = ctx.params.id;

  const [existing] = await db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const nextName = parsed.data.name?.trim();

  const [updated] = await db
    .update(categories)
    .set({
      name: nextName ?? existing.name,
      parentId: parsed.data.parentId === undefined ? existing.parentId : parsed.data.parentId,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  await writeAdminAudit({
    actorId: guard.actor.id,
    actorRole: guard.actor.role,
    action: 'category_update',
    entityType: 'category',
    entityId: id,
    meta: { before: existing, after: { name: nextName ?? existing.name, parentId: parsed.data.parentId } },
  });

  return NextResponse.json({ ok: true, updatedId: updated?.id || id });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const id = ctx.params.id;

  const [cat] = await db.select({ id: categories.id, slug: categories.slug }).from(categories).where(eq(categories.id, id)).limit(1);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [usage] = await db
    .select({ cnt: count(products.id) })
    .from(products)
    .where(eq(products.categoryId, id));

  if ((usage?.cnt || 0) > 0) {
    return NextResponse.json({ error: 'Category has products; merge or move products first.' }, { status: 400 });
  }

  await db.delete(categories).where(eq(categories.id, id));

  await writeAdminAudit({
    actorId: guard.actor.id,
    actorRole: guard.actor.role,
    action: 'category_delete',
    entityType: 'category',
    entityId: id,
    meta: { slug: cat.slug },
  });

  return NextResponse.json({ ok: true });
}
