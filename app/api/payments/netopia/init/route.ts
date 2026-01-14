import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { createNetopiaV2PaymentRequest, NetopiaPaymentRequest } from "@/lib/netopia";
import { SITE_URL } from "@/lib/env";
import { z } from "zod";

const initPaymentSchema = z.object({
  order_id: z.string().min(1), // Can be UUID or orderNumber (ORD-YYYYMMDD-XXXXX)
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = initPaymentSchema.parse(body);
    
    // Detect if it's an orderNumber (format: ORD-YYYYMMDD-XXXXX) or UUID
    const isOrderNumber = /^ORD-\d{8}-[A-Z0-9]{5}$/.test(order_id);

    // Get order and validate ownership - lookup by orderNumber or UUID
    const orderResult = await db
      .select()
      .from(orders)
      .where(
        isOrderNumber 
          ? eq(orders.orderNumber, order_id)
          : eq(orders.id, order_id)
      )
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
    // Netopia v2 requires JSON API - form submission is no longer supported
    // Use orderNumber for friendly URLs
    const paymentRequest: NetopiaPaymentRequest = {
      orderId: order.id,
      amount: order.totalCents / 100, // Convert cents to RON
      currency: order.currency,
      description: `Comanda ${order.orderNumber} - FloristMarket`,
      returnUrl: `${SITE_URL}/finalizare/success?order_id=${order.orderNumber}`,
      confirmUrl: `${SITE_URL}/api/payments/netopia/callback`,
    };

    // Netopia v2 API requires API Key
    if (!process.env.NETOPIA_API_KEY) {
      return NextResponse.json({ 
        error: "NETOPIA_API_KEY is required. Please configure it in environment variables." 
      }, { status: 500 });
    }

    try {
      // Get user info for billing
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const user = userResult[0];

      const paymentResponse = await createNetopiaV2PaymentRequest({
        ...paymentRequest,
        billing: {
          email: user?.email || '',
          phone: '', // TODO: Get from user profile
          firstName: user?.name?.split(' ')[0] || '',
          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
          city: '', // TODO: Get from user address
          country: '642', // Romania
          postalCode: '' // TODO: Get from user address
        }
      });
      return NextResponse.json(paymentResponse);
    } catch (error) {
      console.error('Netopia v2 API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: `Payment initialization failed: ${errorMessage}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Init payment error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
