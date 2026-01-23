import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, refunds } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logOrderAction } from '@/lib/audit';
import { logWebhook } from '@/lib/webhook-logging';
import { processRefund } from '@/lib/refunds/process';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/refunds/[id]/retry
 * Single-person retry for failed refunds (audited).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const refund = await db.query.refunds.findFirst({ where: eq(refunds.id, id) });
    if (!refund) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (refund.status !== 'failed') {
      return NextResponse.json({ error: 'Only FAILED refunds can be retried' }, { status: 409 });
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, refund.orderId) });
    const currency = order?.currency || 'RON';
    const amount = Number(refund.amount);

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'refund_retried',
      entityType: 'refund',
      entityId: id,
      message: 'Refund retry requested',
      meta: { orderId: refund.orderId, amount, currency },
    });

    await logOrderAction({
      orderId: refund.orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'refund',
      meta: { refundId: id, retry: true },
    });

    const result = await processRefund(id, refund.orderId, amount, currency);

    await logWebhook({
      source: 'refunds',
      ref: refund.orderId,
      payload: { action: 'retry_refund', refundId: id, amount, currency, success: result.success, status: result.status },
      result: result.success ? 'ok' : 'error',
    });

    return NextResponse.json({
      ok: true,
      refundId: id,
      status: result.status,
      providerRef: result.providerRef,
      failureReason: result.failureReason,
      success: result.success,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
