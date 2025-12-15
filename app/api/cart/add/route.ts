import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { getOrSetSessionId } from "@/lib/cookies";
import { normalizeCurrency } from "@/lib/money";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const sessionId = userId ? null : await getOrSetSessionId();

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ 
        error: "Invalid request body" 
      }, { status: 400 });
    }
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        error: "Invalid request body format" 
      }, { status: 400 });
    }

    if (!body.product_id || !body.qty) {
      return NextResponse.json({ 
        error: "Missing required fields: product_id and qty are required",
        received: { product_id: body.product_id, qty: body.qty }
      }, { status: 400 });
    }

    let product_id: string;
    let qty: number;
    
    try {
      const parsed = addToCartSchema.parse(body);
      product_id = parsed.product_id;
      qty = parsed.qty;
    } catch (error) {
      console.error('Schema validation error:', error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: "Invalid request data",
          details: error.issues 
        }, { status: 400 });
      }
      throw error;
    }
    
    console.log('Add to cart request:', { product_id, qty, userId: userId || 'anonymous', sessionId: sessionId || 'none' });

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

    // Check stock availability
    if (productData.stock < qty) {
      return NextResponse.json({ 
        error: "Insufficient stock",
        availableStock: productData.stock 
      }, { status: 400 });
    }

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
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID required for anonymous cart" }, { status: 400 });
      }
      
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
      // Update quantity - check stock again
      const newQty = Math.min(existingItem[0].qty + qty, 99);
      if (productData.stock < newQty) {
        return NextResponse.json({ 
          error: "Insufficient stock",
          availableStock: productData.stock 
        }, { status: 400 });
      }
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
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data",
        details: error.issues 
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || "Internal server error" 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
