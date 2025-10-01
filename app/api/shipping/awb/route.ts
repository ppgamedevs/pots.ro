import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { shippingProvider } from "@/lib/shipping";
import { logAwbCreation } from "@/lib/audit";
import { z } from "zod";

const awbRequestSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  weightKg: z.number().min(0.1, "Weight must be at least 0.1 kg").optional().default(1.0),
});

export async function POST(request: NextRequest) {
  try {
    // Require seller role
    const user = await requireRole(request, ['seller']);
    
    // Parse and validate request body
    const body = await request.json();
    const { orderId, weightKg } = awbRequestSchema.parse(body);
    
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
    
    // Check if order is in a state that allows AWB creation
    if (!['packed', 'shipped'].includes(order.status)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Order must be packed or shipped to create AWB" 
      }, { status: 409 });
    }
    
    // Create AWB using shipping provider
    const awbResult = await shippingProvider.createAwb({
      orderId,
      to: order.shippingAddress as any, // Type assertion for now
      weightKg,
    });
    
    // Update order with AWB information
    await db
      .update(orders)
      .set({
        awbNumber: awbResult.awbNumber,
        awbLabelUrl: awbResult.awbLabelUrl,
        carrierMeta: awbResult.carrierMeta,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    // Log AWB creation
    await logAwbCreation(
      orderId,
      awbResult.awbNumber,
      awbResult.carrierMeta?.provider || 'unknown',
      user.id,
      user.role
    );
    
    return NextResponse.json({
      ok: true,
      awb: {
        awbNumber: awbResult.awbNumber,
        awbLabelUrl: awbResult.awbLabelUrl,
        carrierMeta: awbResult.carrierMeta,
      }
    });
    
  } catch (error) {
    console.error("Create AWB error:", error);
    
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
