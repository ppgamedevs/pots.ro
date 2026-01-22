import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, orders } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sellerIdsForUser } from '@/lib/ownership';
import { logWebhook } from '@/lib/webhook-logging';
import { z } from 'zod';

const denySchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

/**
 * POST /api/orders/[id]/deny-return
 * Deny a return request (admin/support or seller owning the order).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'support' && user.role !== 'seller')) {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = denySchema.parse(await request.json().catch(() => ({})));

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Comanda nu a fost găsită' }, { status: 404 });
    }

    if (order.status !== 'return_requested') {
      return NextResponse.json({ success: false, error: 'Comanda nu are cerere de retur în așteptare' }, { status: 400 });
    }

    if (user.role === 'seller') {
      const ids = await sellerIdsForUser(user.id);
      if (!ids.includes(order.sellerId)) {
        return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
      }
    }

    const restoredStatus = order.deliveredAt ? 'delivered' : order.paidAt ? 'paid' : 'paid';

    await db.update(orders)
      .set({ status: restoredStatus as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await db.insert(auditLogs).values({
      orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'deny_return',
      meta: {
        notes: body.notes || null,
        restoredStatus,
        deniedAt: new Date().toISOString(),
      },
    });

    await logWebhook({
      source: 'orders',
      ref: orderId,
      payload: { action: 'deny_return', notes: body.notes || null },
      result: 'ok',
    });

    return NextResponse.json({ success: true, orderId, status: restoredStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Eroare necunoscută';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
