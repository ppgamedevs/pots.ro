import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { getOrSetSessionId } from "@/lib/cookies";
import { z } from "zod";

const updateItemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().int().min(0).max(99),
});

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const sessionId = userId ? null : await getOrSetSessionId();

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
        return NextResponse.json({ error: "Session ID required for anonymous cart" }, { status: 400 });
      }
      
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      cart = result[0];
    }

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });

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
    const sessionId = userId ? null : await getOrSetSessionId();

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
        return NextResponse.json({ error: "Session ID required for anonymous cart" }, { status: 400 });
      }
      
      const result = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      cart = result[0];
    }

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Remove item
    await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, product_id)
      ));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete cart item error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
