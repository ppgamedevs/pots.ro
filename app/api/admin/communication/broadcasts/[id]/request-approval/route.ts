import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { communicationBroadcasts } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);

    const [row] = await db
      .select({ id: communicationBroadcasts.id, status: communicationBroadcasts.status, kind: communicationBroadcasts.kind })
      .from(communicationBroadcasts)
      .where(eq(communicationBroadcasts.id, ctx.params.id))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (row.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft broadcasts can be submitted for approval' }, { status: 409 });
    }

    const now = new Date();
    await db
      .update(communicationBroadcasts)
      .set({ status: 'pending_approval', updatedAt: now } as any)
      .where(and(eq(communicationBroadcasts.id, ctx.params.id), eq(communicationBroadcasts.status, 'draft')));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'comm_broadcast_request_approval',
      entityType: 'communication_broadcast',
      entityId: ctx.params.id,
      meta: { kind: row.kind },
    });

    return NextResponse.json({ ok: true, id: ctx.params.id, status: 'pending_approval' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
