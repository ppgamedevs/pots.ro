import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { categories, categoryRedirects, products, users } from '@/db/schema/core';
import { and, eq } from 'drizzle-orm';
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

const schema = z.object({
  fromCategoryId: z.string().uuid(),
  toCategoryId: z.string().uuid(),
  reason: z.string().min(5).max(500).optional(),
});

export async function POST(req: NextRequest) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
  }

  const { fromCategoryId, toCategoryId, reason } = parsed.data;
  if (fromCategoryId === toCategoryId) return NextResponse.json({ error: 'Invalid merge' }, { status: 400 });

  const [from] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.id, fromCategoryId))
    .limit(1);
  const [to] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.id, toCategoryId))
    .limit(1);

  if (!from || !to) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Move products
  await db.update(products).set({ categoryId: to.id, updatedAt: new Date() }).where(eq(products.categoryId, from.id));

  // Redirect old slug -> new slug (idempotent)
  await db
    .insert(categoryRedirects)
    .values({ fromSlug: from.slug, toSlug: to.slug, reason: reason || `merge:${from.slug}->${to.slug}`, createdBy: guard.actor.id, createdAt: new Date() })
    .onConflictDoUpdate({
      target: categoryRedirects.fromSlug,
      set: { toSlug: to.slug, reason: reason || `merge:${from.slug}->${to.slug}`, createdBy: guard.actor.id, createdAt: new Date() },
    });

  // Delete the old category
  await db.delete(categories).where(eq(categories.id, from.id));

  await writeAdminAudit({
    actorId: guard.actor.id,
    actorRole: guard.actor.role,
    action: 'category_merge',
    entityType: 'category',
    entityId: to.id,
    message: reason || null,
    meta: { from: { id: from.id, slug: from.slug }, to: { id: to.id, slug: to.slug } },
  });

  return NextResponse.json({ ok: true });
}
