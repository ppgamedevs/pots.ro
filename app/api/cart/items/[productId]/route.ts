import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { CART_SESSION_COOKIE_NAME, cartSessionCookieOptions, getOrCreateCartSessionId } from "@/lib/cookies";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateItemSchema = z.object({
  qty: z.number().int().min(1).max(99),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const userId = await getUserId();
    const session = userId ? null : getOrCreateCartSessionId();
    const sessionId = userId ? null : session?.sessionId;

    const json = (body: any, init?: { status?: number }) => {
      const res = NextResponse.json(body, init);
      if (!userId && session?.isNew) {
        res.cookies.set(CART_SESSION_COOKIE_NAME, session.sessionId, cartSessionCookieOptions);
      }
      return res;
    };

    const body = await request.json();
    const { qty } = updateItemSchema.parse(body);

    // Validate productId is UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return json({ error: "Invalid product ID format" }, { status: 400 });
    }

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
        return json({ error: "Session ID required for anonymous cart" }, { status: 400 });
      }
      
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      cart = result[0];
    }

    if (!cart) {
      return json({ error: "Cart not found" }, { status: 404 });
    }

    // Check if item exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId)
      ))
      .limit(1);

    if (!existingItem[0]) {
      return json({ error: "Item not found in cart" }, { status: 404 });
    }

    // Check stock availability
    const product = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product[0] && product[0].stock < qty) {
      return json({ 
        error: "Insufficient stock",
        availableStock: product[0].stock 
      }, { status: 400 });
    }

    // Update quantity
    await db
      .update(cartItems)
      .set({ qty })
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId)
      ));

    return json({ success: true });
    
  } catch (error) {
    console.error('Cart item PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data",
        details: error.issues 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Failed to update item quantity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const userId = await getUserId();
    const session = userId ? null : getOrCreateCartSessionId();
    const sessionId = userId ? null : session?.sessionId;

    const json = (body: any, init?: { status?: number }) => {
      const res = NextResponse.json(body, init);
      if (!userId && session?.isNew) {
        res.cookies.set(CART_SESSION_COOKIE_NAME, session.sessionId, cartSessionCookieOptions);
      }
      return res;
    };

    // Validate productId is UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return json({ error: "Invalid product ID format" }, { status: 400 });
    }

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
        return json({ error: "Session ID required for anonymous cart" }, { status: 400 });
      }
      
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      cart = result[0];
    }

    if (!cart) {
      return json({ error: "Cart not found" }, { status: 404 });
    }

    // Remove item
    await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId)
      ));

    return json({ success: true });
    
  } catch (error) {
    console.error('Cart item DELETE error:', error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
