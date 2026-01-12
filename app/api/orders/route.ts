import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers } from "@/db/schema/core";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

type Order = InferSelectModel<typeof orders>;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let ordersResult;
    let totalCount;

    if (role === 'buyer') {
      // Get buyer orders
      const whereConditions = [eq(orders.buyerId, userId)];
      if (status) {
        whereConditions.push(eq(orders.status, status as any));
      }

      ordersResult = await db
        .select()
        .from(orders)
        .where(and(...whereConditions))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: orders.id })
        .from(orders)
        .where(and(...whereConditions));
      totalCount = countResult.length;
    } else if (role === 'seller') {
      // Get seller orders
      const userSellerIds = await sellerIdsForUser(userId);
      if (userSellerIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, limit });
      }

      const whereConditions = [eq(orderItems.sellerId, userSellerIds[0])];
      if (status) {
        whereConditions.push(eq(orders.status, status as any));
      }

      // Get unique orders for this seller
      const orderItemsResult = await db
        .selectDistinct({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...whereConditions))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const orderIds = orderItemsResult.map((item: { orderId: string }) => item.orderId);
      if (orderIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, limit });
      }

      ordersResult = await db
        .select()
        .from(orders)
        .where(and(
          inArray(orders.id, orderIds),
          ...(status ? [eq(orders.status, status as any)] : [])
        ))
        .orderBy(desc(orders.createdAt));

      // Count total
      const countResult = await db
        .selectDistinct({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...whereConditions));
      totalCount = countResult.length;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Format response
    const formattedOrders = ordersResult.map((order: Order) => ({
      id: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: order.status,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      shippingFeeCents: order.shippingFeeCents,
      totalDiscountCents: order.totalDiscountCents,
      totalCents: order.totalCents,
      paymentRef: order.paymentRef,
      shippingAddress: order.shippingAddress,
      awbNumber: order.awbNumber,
      awbLabelUrl: order.awbLabelUrl,
      carrierMeta: order.carrierMeta,
      deliveredAt: order.deliveredAt,
      canceledReason: order.canceledReason,
      deliveryStatus: order.deliveryStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json({
      data: formattedOrders,
      total: totalCount,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
