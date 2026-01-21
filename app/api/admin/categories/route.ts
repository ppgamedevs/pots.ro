import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { categories, products, users } from '@/db/schema/core';
import { and, asc, count, eq, ilike } from 'drizzle-orm';
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

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  parentId: z.string().uuid().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  const where = q ? ilike(categories.name, `%${q}%`) : undefined;

  const rows = await db
    .select({
      id: categories.id,
      parentId: categories.parentId,
      name: categories.name,
      slug: categories.slug,
      slugLocked: categories.slugLocked,
      position: categories.position,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productsCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(where)
    .groupBy(categories.id)
    .orderBy(asc(categories.parentId), asc(categories.position), asc(categories.name));

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
  }

  const { name, slug, parentId } = parsed.data;

  const [created] = await db
    .insert(categories)
    .values({
      name: name.trim(),
      slug: slug.trim(),
      parentId: parentId || null,
      slugLocked: true,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: categories.id, slug: categories.slug });

  await writeAdminAudit({
    actorId: guard.actor.id,
    actorRole: guard.actor.role,
    action: 'category_create',
    entityType: 'category',
    entityId: created.id,
    meta: { slug: created.slug, name },
  });

  return NextResponse.json({ ok: true, category: created });
}
