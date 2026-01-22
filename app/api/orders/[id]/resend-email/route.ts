import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, orders, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { z } from 'zod';
import { sendOrderDeliveredEmail, sendOrderPaidEmail, sendOrderShippedEmail } from '@/lib/hooks/orderHooks';

const schema = z.object({
  type: z.enum(['paid', 'shipped', 'delivered']),
});

function canResend(type: 'paid' | 'shipped' | 'delivered', status: string) {
  if (type === 'paid') return ['paid', 'packed', 'shipped', 'delivered', 'canceled', 'refunded', 'return_requested', 'return_approved', 'returned'].includes(status);
  if (type === 'shipped') return ['shipped', 'delivered', 'return_requested', 'return_approved', 'returned'].includes(status);
  if (type === 'delivered') return ['delivered', 'return_requested', 'return_approved', 'returned'].includes(status);
  return false;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'support')) {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { type } = schema.parse(await request.json());

    const row = await db
      .select({
        order: orders,
        buyerEmail: users.email,
        buyerName: users.name,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!row.length) {
      return NextResponse.json({ success: false, error: 'Comanda nu a fost găsită' }, { status: 404 });
    }

    const { order, buyerEmail, buyerName } = row[0];
    const status = String(order.status);
    if (!canResend(type, status)) {
      return NextResponse.json({ success: false, error: 'Email-ul nu poate fi retrimis pentru status-ul curent' }, { status: 409 });
    }

    const shippingAddress = (order.shippingAddress as any) || {};
    const name = shippingAddress?.name || buyerName || 'Customer';

    let result: any = { success: false, error: 'Unknown' };
    if (type === 'paid') {
      result = await sendOrderPaidEmail(orderId, buyerEmail, name, Number(order.totalCents) / 100, order.currency || 'RON');
    } else if (type === 'shipped') {
      const carrierMeta = order.carrierMeta as any;
      result = await sendOrderShippedEmail(
        orderId,
        buyerEmail,
        name,
        order.awbNumber || undefined,
        carrierMeta?.carrier || undefined,
        carrierMeta?.trackingUrl || undefined
      );
    } else if (type === 'delivered') {
      result = await sendOrderDeliveredEmail(orderId, buyerEmail, name, `https://floristmarket.ro/orders/${orderId}/review`);
    }

    await db.insert(auditLogs).values({
      orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'resend_email',
      meta: { type, email: buyerEmail, ok: !!result?.success },
    });

    return NextResponse.json({ success: !!result?.success, error: result?.error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Eroare necunoscută';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
