import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { logStatusChange } from "@/lib/audit";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'paid',
    'packed',
    'shipped',
    'delivered',
    'canceled',
    'refunded',
    'return_requested',
    'return_approved',
    'returned',
  ]),
  note: z.string().trim().max(2000).optional(),
});

// Admin-only endpoint to update order status
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    
    // Only admins can update order status directly
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
  const { status, note } = updateStatusSchema.parse(body);

    // Check if order exists
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderResult.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previousStatus = orderResult[0].status;

    // Update order status (manual override)
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamp fields based on status
    if (status === 'paid') {
      updateData.paidAt = new Date();
    } else if (status === 'packed') {
      updateData.packedAt = new Date();
    } else if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));

    await logStatusChange(id, String(previousStatus), status, user.id, user.role, {
      manualOverride: true,
      note: note || null,
    });

    console.log(`[Admin] Order ${id} status updated to ${status} by ${user.email}`);

    return NextResponse.json({ 
      success: true, 
      orderId: id, 
      newStatus: status 
    });

  } catch (error) {
    console.error("Update order status error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
