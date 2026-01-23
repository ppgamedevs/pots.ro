import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { communicationBroadcasts } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const createSchema = z
  .object({
    kind: z.enum(['system', 'announcement', 'marketing']).default('announcement'),
    name: z.string().min(3).max(200),
    subject: z.string().min(3).max(240),
    html: z.string().min(20),
    text: z.string().max(20000).optional(),
    fromEmail: z.string().max(240).optional(),
    segment: z.any().optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const conditions: any[] = [];
    if (status) conditions.push(eq(communicationBroadcasts.status, status as any));
    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: communicationBroadcasts.id,
        kind: communicationBroadcasts.kind,
        channel: communicationBroadcasts.channel,
        status: communicationBroadcasts.status,
        name: communicationBroadcasts.name,
        subject: communicationBroadcasts.subject,
        fromEmail: communicationBroadcasts.fromEmail,
        scheduledAt: communicationBroadcasts.scheduledAt,
        approvedAt: communicationBroadcasts.approvedAt,
        sendStartedAt: communicationBroadcasts.sendStartedAt,
        sendCompletedAt: communicationBroadcasts.sendCompletedAt,
        createdBy: communicationBroadcasts.createdBy,
        createdAt: communicationBroadcasts.createdAt,
        updatedAt: communicationBroadcasts.updatedAt,
      })
      .from(communicationBroadcasts)
      .where(where)
      .orderBy(desc(communicationBroadcasts.createdAt))
      .limit(100);

    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    if (parsed.data.kind === 'marketing' && !parsed.data.segment) {
      return NextResponse.json({ error: 'Marketing broadcasts require a segment' }, { status: 400 });
    }

    const now = new Date();
    const [created] = await db
      .insert(communicationBroadcasts)
      .values({
        kind: parsed.data.kind,
        channel: 'email',
        status: 'draft',
        name: parsed.data.name,
        subject: parsed.data.subject,
        html: parsed.data.html,
        text: parsed.data.text || null,
        fromEmail: parsed.data.fromEmail || null,
        segment: parsed.data.segment || null,
        createdBy: actor.id,
        createdAt: now,
        updatedAt: now,
      } as any)
      .returning({ id: communicationBroadcasts.id });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'comm_broadcast_create',
      entityType: 'communication_broadcast',
      entityId: created.id,
      meta: { kind: parsed.data.kind, name: parsed.data.name },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
