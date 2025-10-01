import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products, sellers, orders, orderItems } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { getOrSetSessionId } from "@/lib/cookies";
import { COMMISSION_PCT } from "@/lib/env";
import { calculateCommission, calculateSellerDue } from "@/lib/money";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  shippingChoice: z.object({
    carrier: z.string(),
    service: z.string(),
    fee_cents: z.number().int().min(0),
  }).optional(),
  address: z.object({
    // For future use
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { shippingChoice } = createOrderSchema.parse(body);

    // Get user's cart
    const cartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    const cart = cartResult[0];
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Get cart items with product details
    const cartItemsResult = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        qty: cartItems.qty,
        priceCents: cartItems.priceCents,
        product: products,
        seller: sellers,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(eq(cartItems.cartId, cart.id));

    if (cartItemsResult.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate each item
    for (const item of cartItemsResult) {
      if (item.product.status !== 'active') {
        return NextResponse.json({ 
          error: `Product ${item.product.title} is no longer available` 
        }, { status: 400 });
      }

      if (item.product.stock < item.qty) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${item.product.title}. Available: ${item.product.stock}, Requested: ${item.qty}` 
        }, { status: 400 });
      }

      if (item.product.currency !== 'RON') {
        return NextResponse.json({ 
          error: `Currency mismatch for ${item.product.title}. Only RON is supported in MVP` 
        }, { status: 400 });
      }
    }

    // Calculate subtotal
    const subtotalCents = cartItemsResult.reduce((sum, item) => sum + (item.priceCents * item.qty), 0);

    // Get shipping fee (use provided choice or default to cheapest)
    let shippingFeeCents = 0;
    if (shippingChoice) {
      shippingFeeCents = shippingChoice.fee_cents;
    } else {
      // Default to cheapest option (DPD Classic for 1kg)
      shippingFeeCents = 1849; // 18.49 RON
    }

    const totalCents = subtotalCents + shippingFeeCents;

    // Create order and order items in a transaction
    const newOrder = await db.transaction(async (tx) => {
      // Insert order
      const orderResult = await tx
        .insert(orders)
        .values({
          buyerId: userId,
          status: 'pending',
          currency: 'RON',
          subtotalCents,
          shippingFeeCents,
          totalCents,
          deliveryCarrier: shippingChoice?.carrier || 'DPD',
          deliveryService: shippingChoice?.service || 'Classic',
        })
        .returning();

      const order = orderResult[0];

      // Insert order items
      const orderItemsData = cartItemsResult.map(item => {
        const itemSubtotalCents = item.priceCents * item.qty;
        const commissionAmountCents = calculateCommission(itemSubtotalCents, COMMISSION_PCT);
        const sellerDueCents = calculateSellerDue(itemSubtotalCents, commissionAmountCents);

        return {
          orderId: order.id,
          productId: item.productId,
          sellerId: item.seller.id,
          qty: item.qty,
          unitPriceCents: item.priceCents,
          subtotalCents: itemSubtotalCents,
          commissionPct: COMMISSION_PCT,
          commissionAmountCents,
          sellerDueCents,
        };
      });

      await tx.insert(orderItems).values(orderItemsData);

      // Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await tx.delete(carts).where(eq(carts.id, cart.id));

      return order;
    });

    return NextResponse.json({
      order_id: newOrder.id,
      totals: {
        subtotal_cents: newOrder.subtotalCents,
        shipping_fee_cents: newOrder.shippingFeeCents,
        total_cents: newOrder.totalCents,
        currency: newOrder.currency,
      },
      shipping: {
        carrier: newOrder.deliveryCarrier,
        service: newOrder.deliveryService,
      },
      status: newOrder.status,
    }, { status: 201 });

  } catch (error) {
    console.error("Create order error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
