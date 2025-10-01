import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, orders } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/authz";
import { ensureConversation } from "@/lib/conversation-helpers";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const orderId = params.orderId;
    
    // Get order and verify access
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    // Check if user is buyer or seller
    const isBuyer = order.buyerId === user.id;
    const isSeller = order.sellerId === user.id;
    
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Get or create conversation
    const conversationId = await ensureConversation(
      orderId,
      order.buyerId,
      order.sellerId
    );
    
    return NextResponse.json({
      ok: true,
      conversationId,
      orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
    });
    
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
