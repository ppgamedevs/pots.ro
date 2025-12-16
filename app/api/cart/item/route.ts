import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { CART_SESSION_COOKIE_NAME, cartSessionCookieOptions, getOrCreateCartSessionId } from "@/lib/cookies";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateItemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().int().min(0).max(99),
});

export async function PATCH(request: NextRequest) {
  try {
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
    const { product_id, qty } = updateItemSchema.parse(body);

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

    if (qty === 0) {
      // Remove item
      await db
        .delete(cartItems)
        .where(and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, product_id)
        ));
    } else {
      // Update quantity
      await db
        .update(cartItems)
        .set({ qty })
        .where(and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, product_id)
        ));
    }

    return json({ success: true });

  } catch (error) {
    console.error("Update cart item error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const { product_id } = z.object({
      product_id: z.string().uuid(),
    }).parse(body);

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
        eq(cartItems.productId, product_id)
      ));

    return json({ success: true });

  } catch (error) {
    console.error("Delete cart item error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
