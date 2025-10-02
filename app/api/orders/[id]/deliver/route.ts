import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { validateTransition } from "@/lib/orderTransitions";
import { logStatusChange } from "@/lib/audit";
import { sendOrderDeliveredEmail } from "@/lib/hooks/orderHooks";
import { logWebhook } from "@/lib/webhook-logging";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin role
    const user = await requireRole(request, ['admin']);
    
    const orderId = params.id;
    
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
    
    // Validate transition
    try {
      validateTransition(order.status, 'delivered');
    } catch (error) {
      return NextResponse.json({ 
        ok: false, 
        error: error instanceof Error ? error.message : "Invalid transition" 
      }, { status: 409 });
    }
    
    // Update order status and delivery timestamp
    const now = new Date();
    await db
      .update(orders)
      .set({ 
        status: 'delivered',
        deliveredAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));
    
    // Log the action
    await logStatusChange(
      orderId,
      order.status,
      'delivered',
      user.id,
      user.role,
      { deliveredAt: now.toISOString() }
    );
    
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
        await sendOrderDeliveredEmail(
          orderId,
          buyer.email,
          shippingAddress?.name || 'Customer',
          `https://pots.ro/orders/${orderId}/review` // Review URL
        );
      }
    } catch (emailError) {
      console.error('Failed to send delivered email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Log webhook event
    await logWebhook({
      source: 'shipping',
      ref: orderId,
      payload: { status: 'delivered', deliveredAt: now.toISOString() },
    });
    
    return NextResponse.json({ 
      ok: true, 
      order: { 
        id: orderId, 
        status: 'delivered',
        deliveredAt: now.toISOString()
      } 
    });
    
  } catch (error) {
    console.error("Deliver order error:", error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
