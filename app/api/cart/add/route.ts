import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { getOrSetSessionId } from "@/lib/cookies";
import { normalizeCurrency } from "@/lib/money";
import { z } from "zod";

const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const sessionId = userId ? null : await getOrSetSessionId();

    const body = await request.json();
    const { product_id, qty } = addToCartSchema.parse(body);

    // Get product to verify it's active and get price
    const product = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, product_id),
        eq(products.status, 'active')
      ))
      .limit(1);

    if (!product[0]) {
      return NextResponse.json({ error: "Product not found or not available" }, { status: 404 });
    }

    const productData = product[0];
    const currency = normalizeCurrency(productData.currency);

    // Get or create cart
    let cart;
    if (userId) {
      // User cart
      const existingCart = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

      if (existingCart[0]) {
        cart = existingCart[0];
      } else {
        const newCart = await db
          .insert(carts)
          .values({
            userId,
            currency,
          })
          .returning();
        cart = newCart[0];
      }
    } else {
      // Session cart
      const existingCart = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);

      if (existingCart[0]) {
        cart = existingCart[0];
      } else {
        const newCart = await db
          .insert(carts)
          .values({
            sessionId,
            currency,
          })
          .returning();
        cart = newCart[0];
      }
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, product_id)
      ))
      .limit(1);

    if (existingItem[0]) {
      // Update quantity
      const newQty = Math.min(existingItem[0].qty + qty, 99);
      await db
        .update(cartItems)
        .set({ qty: newQty })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      // Add new item
      await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId: product_id,
          qty,
          priceCents: productData.priceCents,
          currency,
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Add to cart error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
