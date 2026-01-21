import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { categories, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
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

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        parentId: z.string().uuid().nullable(),
        position: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const guard = await assertAdminOrSupport();
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
  }

  // Minimal approach: sequential updates (small dataset)
  for (const item of parsed.data.items) {
    await db
      .update(categories)
      .set({ parentId: item.parentId, position: item.position, updatedAt: new Date() })
      .where(eq(categories.id, item.id));
  }

  await writeAdminAudit({
    actorId: guard.actor.id,
    actorRole: guard.actor.role,
    action: 'category_reorder',
    entityType: 'category',
    entityId: 'bulk',
    meta: { count: parsed.data.items.length },
  });

  return NextResponse.json({ ok: true });
}
