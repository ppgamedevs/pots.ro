import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { communicationBroadcasts } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const schema = z
  .object({
    reason: z.string().min(3).max(1000),
  })
  .strict();

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const [row] = await db
      .select({ id: communicationBroadcasts.id, status: communicationBroadcasts.status, kind: communicationBroadcasts.kind })
      .from(communicationBroadcasts)
      .where(eq(communicationBroadcasts.id, ctx.params.id))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (row.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Broadcast is not pending approval' }, { status: 409 });
    }

    const now = new Date();
    await db
      .update(communicationBroadcasts)
      .set({
        status: 'rejected',
        rejectedBy: actor.id,
        rejectedAt: now,
        rejectionReason: parsed.data.reason,
        updatedAt: now,
      } as any)
      .where(and(eq(communicationBroadcasts.id, ctx.params.id), eq(communicationBroadcasts.status, 'pending_approval')));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'comm_broadcast_reject',
      entityType: 'communication_broadcast',
      entityId: ctx.params.id,
      meta: { kind: row.kind, reason: parsed.data.reason },
    });

    return NextResponse.json({ ok: true, id: ctx.params.id, status: 'rejected' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
