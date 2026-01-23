import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { productLocks } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type ProductLockRow = {
  id: string;
  scope: 'price' | 'stock' | 'all';
  lockedUntil: Date;
  reason: string;
  createdBy: string | null;
  createdAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
};

const createSchema = z
  .object({
    scope: z.enum(['price', 'stock', 'all']),
    lockedUntil: z.string().datetime(),
    reason: z.string().min(3).max(1000),
  })
  .strict();

const revokeSchema = z
  .object({
    lockId: z.string().uuid(),
    reason: z.string().min(3).max(1000),
  })
  .strict();

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    await requireRole(req, ['admin']);

    const productId = ctx.params.id;
    const rows: ProductLockRow[] = await db
      .select({
        id: productLocks.id,
        scope: productLocks.scope,
        lockedUntil: productLocks.lockedUntil,
        reason: productLocks.reason,
        createdBy: productLocks.createdBy,
        createdAt: productLocks.createdAt,
        revokedAt: productLocks.revokedAt,
        revokedBy: productLocks.revokedBy,
        revokedReason: productLocks.revokedReason,
      })
      .from(productLocks)
      .where(eq(productLocks.productId, productId))
      .orderBy(desc(productLocks.createdAt))
      .limit(100);

    const now = new Date();
    const active = rows.filter((r: ProductLockRow) => !r.revokedAt && r.lockedUntil > now);

    return NextResponse.json({ productId, active, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);

    const productId = ctx.params.id;
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const lockedUntil = new Date(parsed.data.lockedUntil);
    if (!Number.isFinite(lockedUntil.getTime())) {
      return NextResponse.json({ error: 'Invalid lockedUntil' }, { status: 400 });
    }

    const now = new Date();
    if (lockedUntil <= now) {
      return NextResponse.json({ error: 'lockedUntil must be in the future' }, { status: 400 });
    }

    const [created] = await db
      .insert(productLocks)
      .values({
        productId,
        scope: parsed.data.scope,
        lockedUntil,
        reason: parsed.data.reason,
        createdBy: actor.id,
        createdAt: now,
      })
      .returning({
        id: productLocks.id,
        scope: productLocks.scope,
        lockedUntil: productLocks.lockedUntil,
        reason: productLocks.reason,
        createdAt: productLocks.createdAt,
      });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'product_lock_create',
      entityType: 'product',
      entityId: productId,
      meta: {
        lockId: created?.id,
        scope: parsed.data.scope,
        lockedUntil: lockedUntil.toISOString(),
        reason: parsed.data.reason,
      },
    });

    return NextResponse.json({ ok: true, lock: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// Revoke a lock early (keeps the row for history)
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);

    const productId = ctx.params.id;
    const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const now = new Date();

    const [updated] = await db
      .update(productLocks)
      .set({
        revokedAt: now,
        revokedBy: actor.id,
        revokedReason: parsed.data.reason,
      })
      .where(
        and(
          eq(productLocks.id, parsed.data.lockId),
          eq(productLocks.productId, productId),
          isNull(productLocks.revokedAt),
          gt(productLocks.lockedUntil, now)
        )
      )
      .returning({ id: productLocks.id });

    if (!updated) {
      return NextResponse.json({ error: 'Active lock not found' }, { status: 404 });
    }

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'product_lock_revoke',
      entityType: 'product',
      entityId: productId,
      meta: {
        lockId: parsed.data.lockId,
        revokedReason: parsed.data.reason,
      },
    });

    return NextResponse.json({ ok: true, revokedId: updated.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
