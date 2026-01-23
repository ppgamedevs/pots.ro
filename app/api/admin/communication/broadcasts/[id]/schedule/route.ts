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
    scheduledAt: z.string().datetime().optional(),
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
    if (row.status !== 'approved') {
      return NextResponse.json({ error: 'Broadcast must be approved before scheduling' }, { status: 409 });
    }

    const now = new Date();
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : now;
    if (!Number.isFinite(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 });
    }

    await db
      .update(communicationBroadcasts)
      .set({ status: 'scheduled', scheduledAt, updatedAt: now } as any)
      .where(and(eq(communicationBroadcasts.id, ctx.params.id), eq(communicationBroadcasts.status, 'approved')));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'comm_broadcast_schedule',
      entityType: 'communication_broadcast',
      entityId: ctx.params.id,
      meta: { scheduledAt: scheduledAt.toISOString(), kind: row.kind },
    });

    return NextResponse.json({ ok: true, id: ctx.params.id, status: 'scheduled', scheduledAt: scheduledAt.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
