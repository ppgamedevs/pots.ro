import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { createNetopiaPaymentRequest, NetopiaPaymentRequest } from "@/lib/netopia";
import { SITE_URL } from "@/lib/env";
import { z } from "zod";

const initPaymentSchema = z.object({
  order_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = initPaymentSchema.parse(body);

    // Get order and validate ownership
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: `Order cannot be paid. Current status: ${order.status}` 
      }, { status: 400 });
    }

    // Create Netopia payment request
    const paymentRequest: NetopiaPaymentRequest = {
      orderId: order.id,
      amount: order.totalCents / 100, // Convert cents to RON
      currency: order.currency,
      description: `Order ${order.id} - Pots.ro`,
      returnUrl: `${SITE_URL}/checkout/return?order=${order.id}`,
      confirmUrl: `${SITE_URL}/api/payments/netopia/callback`,
    };

    const paymentResponse = createNetopiaPaymentRequest(paymentRequest);

    return NextResponse.json(paymentResponse);

  } catch (error) {
    console.error("Init payment error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
