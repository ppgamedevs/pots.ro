import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { communicationBroadcasts } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    subject: z.string().min(3).max(240).optional(),
    html: z.string().min(20).optional(),
    text: z.string().max(20000).nullable().optional(),
    fromEmail: z.string().max(240).nullable().optional(),
    segment: z.any().nullable().optional(),
  })
  .strict();

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    await requireRole(req, ['admin']);

    const [row] = await db
      .select({
        id: communicationBroadcasts.id,
        kind: communicationBroadcasts.kind,
        channel: communicationBroadcasts.channel,
        status: communicationBroadcasts.status,
        name: communicationBroadcasts.name,
        subject: communicationBroadcasts.subject,
        html: communicationBroadcasts.html,
        text: communicationBroadcasts.text,
        fromEmail: communicationBroadcasts.fromEmail,
        segment: communicationBroadcasts.segment,
        scheduledAt: communicationBroadcasts.scheduledAt,
        approvedBy: communicationBroadcasts.approvedBy,
        approvedAt: communicationBroadcasts.approvedAt,
        rejectedBy: communicationBroadcasts.rejectedBy,
        rejectedAt: communicationBroadcasts.rejectedAt,
        rejectionReason: communicationBroadcasts.rejectionReason,
        sendStartedAt: communicationBroadcasts.sendStartedAt,
        sendCompletedAt: communicationBroadcasts.sendCompletedAt,
        createdBy: communicationBroadcasts.createdBy,
        createdAt: communicationBroadcasts.createdAt,
        updatedAt: communicationBroadcasts.updatedAt,
      })
      .from(communicationBroadcasts)
      .where(eq(communicationBroadcasts.id, ctx.params.id))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ row });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const [before] = await db
      .select({ status: communicationBroadcasts.status })
      .from(communicationBroadcasts)
      .where(eq(communicationBroadcasts.id, ctx.params.id))
      .limit(1);

    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (before.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft broadcasts can be edited' }, { status: 409 });
    }

    const now = new Date();

    const [updated] = await db
      .update(communicationBroadcasts)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.subject !== undefined ? { subject: parsed.data.subject } : {}),
        ...(parsed.data.html !== undefined ? { html: parsed.data.html } : {}),
        ...(parsed.data.text !== undefined ? { text: parsed.data.text } : {}),
        ...(parsed.data.fromEmail !== undefined ? { fromEmail: parsed.data.fromEmail } : {}),
        ...(parsed.data.segment !== undefined ? { segment: parsed.data.segment } : {}),
        updatedAt: now,
      } as any)
      .where(eq(communicationBroadcasts.id, ctx.params.id))
      .returning({ id: communicationBroadcasts.id });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'comm_broadcast_update',
      entityType: 'communication_broadcast',
      entityId: ctx.params.id,
      meta: { fields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ ok: true, id: updated?.id ?? ctx.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
