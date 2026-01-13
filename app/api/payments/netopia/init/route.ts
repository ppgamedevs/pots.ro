import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { createNetopiaPaymentRequest, createNetopiaV2PaymentRequest, NetopiaPaymentRequest } from "@/lib/netopia";
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
    // Try v2 API first (JSON API), fallback to v1 (form submission) if API key not available
    const paymentRequest: NetopiaPaymentRequest = {
      orderId: order.id,
      amount: order.totalCents / 100, // Convert cents to RON
      currency: order.currency,
      description: `Order ${order.id} - Pots.ro`,
      returnUrl: `${SITE_URL}/finalizare/success?order=${order.id}`,
      confirmUrl: `${SITE_URL}/api/payments/netopia/callback`,
    };

    // Try v2 API if API key is available
    if (process.env.NETOPIA_API_KEY) {
      try {
        const paymentResponse = await createNetopiaV2PaymentRequest({
          ...paymentRequest,
          billing: {
            // Add billing info from order if available
            email: '', // TODO: Get from order/user
            phone: '',
            firstName: '',
            lastName: '',
            city: '',
            country: '642', // Romania
            postalCode: ''
          }
        });
        return NextResponse.json(paymentResponse);
      } catch (error) {
        console.error('Netopia v2 API failed, falling back to v1:', error);
        // Fall through to v1
      }
    }

    // Fallback to v1 (form submission)
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
