import { db } from '@/db';
import { orders } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { logStatusChange, logWebhookUpdate } from '@/lib/audit';

export type NetopiaMappedStatus = 'paid' | 'failed' | 'pending';

export type NetopiaCallbackParsed = {
  orderId: string;
  status: NetopiaMappedStatus;
  amount: string;
  currency: string;
  eventId: string;
  providerRef?: string | null;
  isV2: boolean;
};

export async function applyNetopiaPaymentUpdate(
  parsed: NetopiaCallbackParsed,
  opts: {
    source: 'webhook' | 'admin_replay' | 'admin_reconcile';
    actor?: { id: string; role: string };
    reason?: string;
  }
): Promise<{
  ok: boolean;
  applied: boolean;
  previousStatus: string;
  currentStatus: string;
  setPaidAt: boolean;
}> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, parsed.orderId) });
  if (!order) {
    return { ok: false, applied: false, previousStatus: 'missing', currentStatus: 'missing', setPaidAt: false };
  }

  const previousStatus = String(order.status);
  let nextStatus = previousStatus;
  let shouldSetPaidAt = false;
  let shouldUpdate = false;

  const providerRef = parsed.providerRef || null;
  const currentPaymentRef = order.paymentRef || null;
  const shouldUpdatePaymentRef =
    !!providerRef && (!currentPaymentRef || currentPaymentRef.startsWith('manual-'));

  if (parsed.status === 'paid') {
    if (order.paidAt == null) {
      shouldSetPaidAt = true;
      shouldUpdate = true;
    }

    // Only promote status up to paid, never regress from packed/shipped/delivered
    if (['pending', 'failed'].includes(previousStatus)) {
      nextStatus = 'paid';
      shouldUpdate = true;
    }
  }

  if (parsed.status === 'failed') {
    // Never regress already-paid orders based on a failure webhook
    if (previousStatus === 'pending') {
      nextStatus = 'failed';
      shouldUpdate = true;
    }
  }

  if (shouldUpdatePaymentRef) {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    await db
      .update(orders)
      .set({
        status: nextStatus as any,
        paidAt: shouldSetPaidAt ? new Date() : order.paidAt,
        paymentRef: shouldUpdatePaymentRef ? providerRef : order.paymentRef,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, parsed.orderId));
  }

  // Order audit: always record webhook update for traceability.
  await logWebhookUpdate(parsed.orderId, 'netopia', parsed.eventId, parsed.status, {
    source: opts.source,
    isV2: parsed.isV2,
    providerRef: providerRef || undefined,
    amount: parsed.amount,
    currency: parsed.currency,
  });

  if (previousStatus !== nextStatus) {
    await logStatusChange(
      parsed.orderId,
      previousStatus,
      nextStatus,
      opts.actor?.id,
      opts.actor?.role,
      {
        manualOverride: opts.source !== 'webhook',
        note: opts.reason,
        provider: 'netopia',
        eventId: parsed.eventId,
      }
    );
  }

  return {
    ok: true,
    applied: shouldUpdate,
    previousStatus,
    currentStatus: nextStatus,
    setPaidAt: shouldSetPaidAt,
  };
}
