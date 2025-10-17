import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products, sellers, orders, orderItems, promotions, categories } from "@/db/schema/core";
import { eq, and, or, isNull, isNotNull, lte, gte } from "drizzle-orm";
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
        category: categories,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
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
    const subtotalCents = cartItemsResult.reduce((sum: number, item: any) => sum + (item.priceCents * item.qty), 0);

    // Apply promotions/discounts
    let totalDiscountCents = 0;
    const now = new Date();
    
    // Get applicable promotions for each item
    for (const item of cartItemsResult) {
      const applicablePromotions = await db
        .select()
        .from(promotions)
        .where(
          and(
            eq(promotions.active, true),
            eq(promotions.type, 'discount'),
            lte(promotions.startAt, now),
            gte(promotions.endAt, now),
            or(
              isNull(promotions.sellerId), // Global promotion
              eq(promotions.sellerId, item.seller.id), // Seller-specific
              isNull(promotions.targetCategorySlug), // Global
              and(
                isNotNull(promotions.targetCategorySlug),
                eq(promotions.targetCategorySlug, item.category?.slug || '')
              ), // Category-specific
              isNull(promotions.targetProductId), // Global
              eq(promotions.targetProductId, item.productId) // Product-specific
            )
          )
        )
        .orderBy(promotions.createdAt)
        .limit(1);

      if (applicablePromotions.length > 0) {
        const promotion = applicablePromotions[0];
        const itemSubtotalCents = item.priceCents * item.qty;
        
        if (promotion.percent) {
          // Percentage discount
          const discountCents = Math.round(itemSubtotalCents * promotion.percent / 100);
          totalDiscountCents += discountCents;
        } else if (promotion.value) {
          // Fixed value discount (applied once per order for global/category promotions)
          if (!promotion.targetProductId) {
            totalDiscountCents += promotion.value;
          } else {
            // Product-specific discount
            totalDiscountCents += Math.min(promotion.value, itemSubtotalCents);
          }
        }
      }
    }

    // Get shipping fee (use provided choice or default to cheapest)
    let shippingFeeCents = 0;
    if (shippingChoice) {
      shippingFeeCents = shippingChoice.fee_cents;
    } else {
      // Default to cheapest option (DPD Classic for 1kg)
      shippingFeeCents = 1849; // 18.49 RON
    }

    const totalCents = subtotalCents + shippingFeeCents - totalDiscountCents;

    // Mock shipping address for MVP
    const shippingAddress = {
      name: "John Doe",
      address: "Strada Exemplu 123",
      city: "Bucharest",
      county: "Bucharest",
      postalCode: "010001",
      country: "Romania",
      phone: "0712345678",
      email: "john@example.com"
    };

    // Create order and order items in a transaction
    const newOrder = await db.transaction(async (tx: any) => {
      // Get unique seller IDs from cart items
      const uniqueSellerIds = [...new Set(cartItemsResult.map((item: any) => item.seller.id))];
      
      // For MVP, create one order per seller (simplified approach)
      // In a real system, you might want to group by seller and create multiple orders
      const primarySellerId = uniqueSellerIds[0];
      
      // Insert order
      const orderResult = await tx
        .insert(orders)
        .values({
          buyerId: userId,
          sellerId: primarySellerId,
          status: 'pending',
          currency: 'RON',
          subtotalCents,
          shippingFeeCents,
          totalDiscountCents,
          totalCents,
          shippingAddress: shippingAddress,
        })
        .returning();

      const order = orderResult[0];

      // Insert order items with individual discounts
      const orderItemsData = cartItemsResult.map(item => {
        const itemSubtotalCents = item.priceCents * item.qty;
        
        // Calculate item-specific discount (proportional to total discount)
        const itemDiscountCents = totalDiscountCents > 0 
          ? Math.round((itemSubtotalCents / subtotalCents) * totalDiscountCents)
          : 0;
        
        const finalItemSubtotalCents = itemSubtotalCents - itemDiscountCents;
        const commissionAmountCents = calculateCommission(finalItemSubtotalCents, COMMISSION_PCT);
        const sellerDueCents = calculateSellerDue(finalItemSubtotalCents, commissionAmountCents);

        return {
          orderId: order.id,
          productId: item.productId,
          sellerId: item.seller.id,
          qty: item.qty,
          unitPriceCents: item.priceCents,
          discountCents: itemDiscountCents,
          subtotalCents: finalItemSubtotalCents,
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
        total_discount_cents: newOrder.totalDiscountCents,
        total_cents: newOrder.totalCents,
        currency: newOrder.currency,
      },
      discount: {
        applied: totalDiscountCents > 0,
        total_ron: totalDiscountCents / 100,
      },
      shipping: {
        address: newOrder.shippingAddress,
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
