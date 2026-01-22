import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, webhookEvents } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { applyNetopiaPaymentUpdate, NetopiaCallbackParsed } from '@/lib/payments/netopia/processor';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/[orderId]/reconcile
 * Uses latest stored Netopia webhook event (webhook_events) to reconcile state.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { orderId } = await params;

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const lastEvent = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.orderId, orderId),
      orderBy: [desc(webhookEvents.createdAt)],
    });

    if (!lastEvent) {
      return NextResponse.json({ error: 'No webhook events for this order' }, { status: 404 });
    }

    const payload: any = lastEvent.payload || {};
    const callback: any = payload.callback || payload?.callbackData || payload?.data || {};

    const status = callback.status === 'paid' ? 'paid' : callback.status === 'failed' ? 'failed' : payload?.status;
    const parsed: NetopiaCallbackParsed = {
      orderId,
      status: status === 'paid' ? 'paid' : 'failed',
      amount: String(callback.amount || payload.amount || ''),
      currency: String(callback.currency || payload.currency || order.currency || 'RON'),
      eventId: String(payload.eventId || lastEvent.id),
      providerRef: callback.ntpID || payload.providerRef || order.paymentRef || null,
      isV2: !!callback.isV2,
    };

    const result = await applyNetopiaPaymentUpdate(parsed, {
      source: 'admin_reconcile',
      actor: { id: user.id, role: user.role },
      reason: 'reconcile',
    });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payment_reconciled',
      entityType: 'order',
      entityId: orderId,
      message: 'Reconciled payment from last stored webhook event',
      meta: { eventId: parsed.eventId, status: parsed.status, applied: result.applied, provider: 'netopia' },
    });

    return NextResponse.json({ ...result, orderId, eventId: parsed.eventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
