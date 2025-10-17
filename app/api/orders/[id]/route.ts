import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers } from "@/db/schema/core";
import { eq, and, inArray } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const orderId = params.id;

    // Get order
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check access permissions
    const userSellerIds = await sellerIdsForUser(userId);
    const isBuyer = order.buyerId === userId;
    const isSeller = userSellerIds.length > 0;
    const isAdmin = false; // TODO: implement admin check

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get order items
    let orderItemsResult;
    if (isSeller && !isBuyer && !isAdmin) {
      // If user is seller, only show their items
      orderItemsResult = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          sellerId: orderItems.sellerId,
          qty: orderItems.qty,
          unitPriceCents: orderItems.unitPriceCents,
          subtotalCents: orderItems.subtotalCents,
          commissionPct: orderItems.commissionPct,
          commissionAmountCents: orderItems.commissionAmountCents,
          sellerDueCents: orderItems.sellerDueCents,
          product: products,
          seller: sellers,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(sellers, eq(orderItems.sellerId, sellers.id))
        .where(and(
          eq(orderItems.orderId, orderId),
          inArray(orderItems.sellerId, userSellerIds)
        ));
    } else {
      // Show all items for buyer or admin
      orderItemsResult = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          sellerId: orderItems.sellerId,
          qty: orderItems.qty,
          unitPriceCents: orderItems.unitPriceCents,
          subtotalCents: orderItems.subtotalCents,
          commissionPct: orderItems.commissionPct,
          commissionAmountCents: orderItems.commissionAmountCents,
          sellerDueCents: orderItems.sellerDueCents,
          product: products,
          seller: sellers,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(sellers, eq(orderItems.sellerId, sellers.id))
        .where(eq(orderItems.orderId, orderId));
    }

    // Build response
    const response = {
      id: order.id,
      buyer_id: order.buyerId,
      status: order.status,
      currency: order.currency,
      subtotal_cents: order.subtotalCents,
      shipping_fee_cents: order.shippingFeeCents,
      total_cents: order.totalCents,
      payment_ref: order.paymentRef,
      shipping_address: order.shippingAddress,
      awb_number: order.awbNumber,
      awb_label_url: order.awbLabelUrl,
      carrier_meta: order.carrierMeta,
      delivered_at: order.deliveredAt,
      canceled_reason: order.canceledReason,
      delivery_status: order.deliveryStatus,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      items: orderItemsResult.map((item: any) => ({
        id: item.id,
        product_id: item.productId,
        seller_id: item.sellerId,
        qty: item.qty,
        unit_price_cents: item.unitPriceCents,
        subtotal_cents: item.subtotalCents,
        commission_pct: item.commissionPct,
        commission_amount_cents: item.commissionAmountCents,
        seller_due_cents: item.sellerDueCents,
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          image_url: item.product.imageUrl,
        },
        seller: {
          id: item.seller.id,
          slug: item.seller.slug,
          brand_name: item.seller.brandName,
        },
      })),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
