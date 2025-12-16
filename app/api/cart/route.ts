import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products, productImages } from "@/db/schema/core";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUser, getUserId } from "@/lib/auth-helpers";
import { CART_SESSION_COOKIE_NAME, cartSessionCookieOptions, getOrCreateCartSessionId } from "@/lib/cookies";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const session = userId ? null : getOrCreateCartSessionId();
    const sessionId = userId ? null : session?.sessionId;
    const defaultCurrency = "RON";

    const json = (body: any, init?: { status?: number }) => {
      const res = NextResponse.json(body, init);
      if (!userId && session?.isNew) {
        res.cookies.set(CART_SESSION_COOKIE_NAME, session.sessionId, cartSessionCookieOptions);
      }
      return res;
    };

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
        return json({
          items: [],
          totals: {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0,
            currency: defaultCurrency,
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
      return json({
        items: [],
        totals: {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          currency: defaultCurrency,
        }
      });
    }

    // Get cart items with product details
    const items = await db
      .select({
        cart_item_id: cartItems.id,
        product_id: cartItems.productId,
        title: products.title,
        slug: products.slug,
        price_cents: cartItems.priceCents,
        qty: cartItems.qty,
        image_url: products.imageUrl,
        product_status: products.status,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    // Filter out inactive products and calculate totals
    const activeItems = items.filter((item: any) => item.product_status === 'active');
    const subtotalCents = activeItems.reduce((sum: number, item: any) => sum + (item.price_cents * item.qty), 0);

    // Remove inactive items from cart
    const inactiveItems = items.filter((item: any) => item.product_status !== 'active');
    if (inactiveItems.length > 0) {
      const inactiveProductIds = inactiveItems.map((item: any) => item.product_id);
      await db
        .delete(cartItems)
        .where(and(
          eq(cartItems.cartId, cart.id),
          sql`${cartItems.productId} = ANY(${inactiveProductIds})`
        ));
    }

    // Get product images for each item
    const itemsWithImages = await Promise.all(
      activeItems.map(async (item: any) => {
        // Get primary image from productImages
        const images = await db
          .select({
            url: productImages.url,
            alt: productImages.alt,
          })
          .from(productImages)
          .where(
            and(
              eq(productImages.productId, item.product_id),
              eq(productImages.isPrimary, true)
            )
          )
          .limit(1);

        const imageUrl = images[0]?.url || item.image_url || '/placeholder.png';

        return {
          id: item.cart_item_id,
          productId: item.product_id,
          productName: item.title,
          slug: item.slug || '',
          qty: item.qty,
          unitPrice: item.price_cents / 100, // Convert cents to RON
          subtotal: (item.price_cents * item.qty) / 100, // Convert cents to RON
          imageUrl: imageUrl,
        };
      })
    );

    return json({
      items: itemsWithImages,
      totals: {
        subtotal: subtotalCents / 100, // Convert cents to RON
        shipping: 0,
        tax: 0,
        total: subtotalCents / 100, // Convert cents to RON
        currency: cart.currency || defaultCurrency,
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