import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { getOrSetSessionId } from "@/lib/cookies";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const sessionId = userId ? null : await getOrSetSessionId();

    // Get cart
    let cart;
    if (userId) {
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      cart = result[0];
    } else {
      if (!sessionId) {
        return NextResponse.json({
          items: [],
          totals: {
            subtotal_cents: 0,
            currency: 'RON',
          }
        });
      }
      
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      cart = result[0];
    }

    if (!cart) {
      return NextResponse.json({
        items: [],
        totals: {
          subtotal_cents: 0,
          currency: 'RON',
        }
      });
    }

    // Get cart items with product details
    const items = await db
      .select({
        product_id: cartItems.productId,
        title: products.title,
        price_cents: cartItems.priceCents,
        qty: cartItems.qty,
        image_url: products.imageUrl,
        product_status: products.status,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    // Filter out inactive products and calculate totals
    const activeItems = items.filter(item => item.product_status === 'active');
    const subtotalCents = activeItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);

    // Remove inactive items from cart
    const inactiveItems = items.filter(item => item.product_status !== 'active');
    if (inactiveItems.length > 0) {
      const inactiveProductIds = inactiveItems.map(item => item.product_id);
      await db
        .delete(cartItems)
        .where(and(
          eq(cartItems.cartId, cart.id),
          sql`${cartItems.productId} = ANY(${inactiveProductIds})`
        ));
    }

    return NextResponse.json({
      items: activeItems.map(item => ({
        product_id: item.product_id,
        title: item.title,
        price_cents: item.price_cents,
        qty: item.qty,
        image_url: item.image_url,
      })),
      totals: {
        subtotal_cents: subtotalCents,
        currency: cart.currency,
      }
    });

  } catch (error) {
    console.error("Get cart error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}