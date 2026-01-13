import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSellerByUser } from "@/lib/ownership";
import { z } from "zod";
import { isValidTransition } from "@/lib/orderTransitions";

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'packed', 'shipped', 'delivered', 'canceled']),
});

/**
 * PATCH /api/seller/orders/[orderId]/status
 * Permite vânzătorului să actualizeze status-ul comenzii
 * Status-uri disponibile pentru seller:
 * - 'pending' = În așteptare
 * - 'packed' = Preluată (seller preia comanda)
 * - 'shipped' = Predată curierului
 * - 'delivered' = Livrată (automat după integrarea Cargus)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    const seller = await getSellerByUser(user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    // Verifică dacă comanda aparține vânzătorului
    const orderResult = await db
      .select({
        order: orders,
        orderItem: orderItems,
        product: products,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.id, params.orderId),
          eq(products.sellerId, seller.id)
        )
      )
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ 
        error: "Order not found or does not belong to this seller" 
      }, { status: 404 });
    }

    const order = orderResult[0].order;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Verifică dacă tranziția este validă
    if (!isValidTransition(order.status as any, status as any)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${order.status} to ${status}` 
      }, { status: 400 });
    }

    // Pregătește update-ul cu timestamp-uri corespunzătoare
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Adaugă timestamp-uri pentru status-uri specifice
    if (status === 'packed' && !order.packedAt) {
      updateData.packedAt = new Date();
    }
    if (status === 'shipped' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (status === 'delivered' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Actualizează comanda
    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, params.orderId))
      .returning();

    return NextResponse.json({
      ok: true,
      order: {
        id: updated[0].id,
        orderNumber: updated[0].orderNumber,
        status: updated[0].status,
        packedAt: updated[0].packedAt,
        shippedAt: updated[0].shippedAt,
        deliveredAt: updated[0].deliveredAt,
      },
    });

  } catch (error) {
    console.error("Update order status error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
