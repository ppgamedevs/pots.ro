import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { validateTransition } from "@/lib/orderTransitions";
import { logStatusChange } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require seller role
    const user = await requireRole(request, ['seller']);
    
    const orderId = params.id;
    
    // Get order and verify seller ownership
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    
    // Check if seller owns this order
    if (order.sellerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }
    
    // Validate transition
    try {
      validateTransition(order.status, 'packed');
    } catch (error) {
      return NextResponse.json({ 
        ok: false, 
        error: error instanceof Error ? error.message : "Invalid transition" 
      }, { status: 409 });
    }
    
    // Update order status
    await db
      .update(orders)
      .set({ 
        status: 'packed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    // Log the action
    await logStatusChange(
      orderId,
      order.status,
      'packed',
      user.id,
      user.role
    );
    
    return NextResponse.json({ 
      ok: true, 
      order: { 
        id: orderId, 
        status: 'packed' 
      } 
    });
    
  } catch (error) {
    console.error("Pack order error:", error);
    
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
