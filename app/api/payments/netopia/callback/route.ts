import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { parseNetopiaCallback, verifyNetopiaSignature, isNetopiaPaymentSuccess } from "@/lib/netopia";

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Netopia callback
    const formData = await request.formData();
    const callbackData = parseNetopiaCallback(formData);

    // Verify signature
    const signatureData = {
      order_id: callbackData.orderId,
      status: callbackData.status,
      amount: callbackData.amount,
      currency: callbackData.currency,
    };

    if (!verifyNetopiaSignature(signatureData, callbackData.signature)) {
      console.error("Invalid Netopia signature:", callbackData);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Get order
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, callbackData.orderId))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      console.error("Order not found:", callbackData.orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if already processed (idempotency)
    if (order.status === 'paid') {
      console.log("Order already paid, ignoring callback:", callbackData.orderId);
      return NextResponse.json({ status: "already_processed" });
    }

    // Process payment based on status
    if (isNetopiaPaymentSuccess(callbackData.status)) {
      // Update order to paid status - this will trigger stock decrement
      await db
        .update(orders)
        .set({
          status: 'paid',
          paymentRef: callbackData.signature, // Store signature as payment reference
          updatedAt: new Date(),
        })
        .where(eq(orders.id, callbackData.orderId));

      console.log("Order marked as paid:", callbackData.orderId);
    } else {
      // Payment failed - keep as pending or optionally mark as canceled
      console.log("Payment failed for order:", callbackData.orderId, "Status:", callbackData.status);
      
      // Optional: mark as canceled for failed payments
      // await db
      //   .update(orders)
      //   .set({
      //     status: 'canceled',
      //     updatedAt: new Date(),
      //   })
      //   .where(eq(orders.id, callbackData.orderId));
    }

    // Always return 200 to Netopia (unless signature invalid)
    return NextResponse.json({ status: "processed" });

  } catch (error) {
    console.error("Netopia callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
