import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { parseNetopiaCallback, verifyNetopiaSignature, isNetopiaPaymentSuccess } from "@/lib/netopia";
import { sendOrderPaidEmail } from "@/lib/hooks/orderHooks";
import { logWebhook } from "@/lib/webhook-logging";

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
      
      // Create invoice
      try {
        const baseUrl = process.env.APP_BASE_URL || 'https://floristmarket.ro';
        const invoiceResponse = await fetch(`${baseUrl}/api/internal/invoice-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: callbackData.orderId }),
        });
        
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          console.log("Invoice created:", invoiceData.invoiceId);
        } else {
          console.error("Failed to create invoice:", await invoiceResponse.text());
        }
      } catch (invoiceError) {
        console.error("Invoice creation error:", invoiceError);
        // Don't fail the payment processing if invoice creation fails
      }
      
      // Send email notification
      try {
        // Get buyer info for email
        const buyerResult = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, order.buyerId))
          .limit(1);
        
        const buyer = buyerResult[0];
        if (buyer) {
          const shippingAddress = order.shippingAddress as any;
          await sendOrderPaidEmail(
            callbackData.orderId,
            buyer.email,
            shippingAddress?.name || 'Customer',
            order.totalCents,
            order.currency,
            `https://floristmarket.ro/api/invoices/${callbackData.orderId}/pdf` // Invoice URL
          );
        }
      } catch (emailError) {
        console.error('Failed to send paid email:', emailError);
        // Don't fail the payment processing if email fails
      }
      
      // Log webhook event
      await logWebhook({
        source: 'payments',
        ref: callbackData.orderId,
        payload: { status: 'paid', amount: callbackData.amount, currency: callbackData.currency },
      });
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
