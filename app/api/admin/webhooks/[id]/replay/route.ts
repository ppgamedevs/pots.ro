import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logWebhook } from '@/lib/webhook-logging';
import { applyNetopiaPaymentUpdate, NetopiaCallbackParsed } from '@/lib/payments/netopia/processor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { id } = await params;

    const row = await db.query.webhookLogs.findFirst({ where: eq(webhookLogs.id, id) });
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const payload: any = row.payload || {};
    if (row.source !== 'payments' || payload?.provider !== 'netopia') {
      return NextResponse.json({ error: 'Replay supported only for payments/netopia (MVP)' }, { status: 400 });
    }

    const callback: any = payload.callback || {};
    const orderId = String(callback.orderId || payload.ref || row.ref || '');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId in payload' }, { status: 400 });
    }

    const statusRaw = String(callback.status || payload.status || '');
    const parsed: NetopiaCallbackParsed = {
      orderId,
      status: statusRaw === 'paid' ? 'paid' : 'failed',
      amount: String(callback.amount || payload.amount || ''),
      currency: String(callback.currency || payload.currency || 'RON'),
      eventId: String(payload.eventId || row.id),
      providerRef: callback.ntpID || payload.providerRef || null,
      isV2: !!callback.isV2,
    };

    const result = await applyNetopiaPaymentUpdate(parsed, {
      source: 'admin_replay',
      actor: { id: user.id, role: user.role },
      reason: 'replay_webhook',
    });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_replayed',
      entityType: 'webhook_log',
      entityId: row.id,
      message: 'Replayed webhook log (payments/netopia)',
      meta: { source: row.source, ref: row.ref, orderId, applied: result.applied },
    });

    await logWebhook({
      source: 'payments',
      ref: orderId,
      payload: { provider: 'netopia', replayOf: row.id, eventId: parsed.eventId, status: parsed.status },
      result: 'ok',
    });

    return NextResponse.json({ ...result, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
