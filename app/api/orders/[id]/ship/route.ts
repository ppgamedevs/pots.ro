import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { validateTransition } from "@/lib/orderTransitions";
import { logStatusChange } from "@/lib/audit";
import { z } from "zod";

const shipRequestSchema = z.object({
  awbNumber: z.string().min(1, "AWB number is required"),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require seller or admin role
    const user = await requireRole(request, ['seller', 'admin']);
    
    const orderId = params.id;
    
    // Parse and validate request body
    const body = await request.json();
    const { awbNumber } = shipRequestSchema.parse(body);
    
    // Get order and verify access
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    
    // Check access permissions
    if (user.role === 'seller' && order.sellerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }
    
    // Validate transition
    try {
      validateTransition(order.status, 'shipped');
    } catch (error) {
      return NextResponse.json({ 
        ok: false, 
        error: error instanceof Error ? error.message : "Invalid transition" 
      }, { status: 409 });
    }
    
    // Update order status and AWB number
    await db
      .update(orders)
      .set({ 
        status: 'shipped',
        awbNumber: awbNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    // Log the action
    await logStatusChange(
      orderId,
      order.status,
      'shipped',
      user.id,
      user.role,
      { awbNumber }
    );
    
    return NextResponse.json({ 
      ok: true, 
      order: { 
        id: orderId, 
        status: 'shipped',
        awbNumber: awbNumber
      } 
    });
    
  } catch (error) {
    console.error("Ship order error:", error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid input",
        details: error.issues 
      }, { status: 422 });
    }
    
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
