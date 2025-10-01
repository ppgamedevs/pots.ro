import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, webhookEvents } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { logWebhookUpdate } from "@/lib/audit";
import { validateTransition } from "@/lib/orderTransitions";
import { z } from "zod";

const webhookPayloadSchema = z.object({
  provider: z.enum(['cargus', 'dpd', 'mock']),
  eventId: z.string().min(1, "Event ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum(['in_transit', 'out_for_delivery', 'delivered', 'return']),
  meta: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { provider, eventId, orderId, status, meta } = webhookPayloadSchema.parse(body);
    
    // Create idempotency key
    const idempotencyKey = `${provider}:${eventId}`;
    
    // Check if webhook event already exists (idempotency)
    const existingEvent = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, idempotencyKey))
      .limit(1);
    
    if (existingEvent.length > 0) {
      return NextResponse.json({ 
        ok: true, 
        duplicate: true,
        message: "Webhook event already processed" 
      });
    }
    
    // Get order
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    
    // Insert webhook event for idempotency
    await db.insert(webhookEvents).values({
      id: idempotencyKey,
      orderId,
      payload: body,
    });
    
    // Update order delivery status
    await db
      .update(orders)
      .set({
        deliveryStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    // If status is 'delivered' and order is 'shipped', transition to 'delivered'
    if (status === 'delivered' && order.status === 'shipped') {
      try {
        validateTransition(order.status, 'delivered');
        
        const now = new Date();
        await db
          .update(orders)
          .set({
            status: 'delivered',
            deliveredAt: now,
            updatedAt: now,
          })
          .where(eq(orders.id, orderId));
        
        // Log the status change
        await logWebhookUpdate(
          orderId,
          provider,
          eventId,
          status,
          { 
            ...meta,
            statusChanged: true,
            deliveredAt: now.toISOString()
          }
        );
      } catch (error) {
        // Log webhook update even if status transition fails
        await logWebhookUpdate(
          orderId,
          provider,
          eventId,
          status,
          { 
            ...meta,
            statusChangeError: error instanceof Error ? error.message : 'Unknown error'
          }
        );
      }
    } else {
      // Log webhook update
      await logWebhookUpdate(
        orderId,
        provider,
        eventId,
        status,
        meta
      );
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: "Webhook processed successfully",
      orderId,
      status 
    });
    
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid webhook payload",
        details: error.issues 
      }, { status: 422 });
    }
    
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
