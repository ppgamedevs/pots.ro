import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logStatusChange } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

/**
 * POST /api/admin/payments/[orderId]/mark-paid
 * Emergency/exception path. Requires reason + audit.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { orderId } = await params;
    const { reason } = schema.parse(await req.json());

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = String(order.status);
    if (order.paidAt) {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 });
    }

    // Strict: only allow exception from pending/failed.
    if (!['pending', 'failed'].includes(currentStatus)) {
      return NextResponse.json({ error: `Cannot mark paid from status: ${currentStatus}` }, { status: 409 });
    }

    const manualRef = order.paymentRef || `manual-${new Date().toISOString()}`;
    await db
      .update(orders)
      .set({
        status: 'paid' as any,
        paidAt: new Date(),
        paymentRef: manualRef,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payment_mark_paid_exception',
      entityType: 'order',
      entityId: orderId,
      message: 'Marked order as paid (exception)',
      meta: { reason, fromStatus: currentStatus, paymentRef: manualRef, provider: 'netopia' },
    });

    await logStatusChange(orderId, currentStatus, 'paid', user.id, user.role, {
      manualOverride: true,
      note: reason,
      provider: 'netopia',
      exception: true,
    });

    return NextResponse.json({ ok: true, orderId, status: 'paid', paymentRef: manualRef });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
