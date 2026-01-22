import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, sellers, users } from "@/db/schema/core";
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "buyer";
    const status = searchParams.get("status")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const from = searchParams.get("from")?.trim() || "";
    const to = searchParams.get("to")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const baseConditions: any[] = [];

    if (status && status !== "all") {
      baseConditions.push(eq(orders.status, status as any));
    }

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        baseConditions.push(gte(orders.createdAt, d));
      }
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        baseConditions.push(lte(orders.createdAt, d));
      }
    }

    const searchTerm = q ? `%${q}%` : "";

    if (role === "admin") {
      if (user.role !== "admin" && user.role !== "support") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const whereClause = and(
        ...(baseConditions.length ? baseConditions : []),
        ...(q
          ? [
              or(
                ilike(orders.orderNumber, searchTerm),
                ilike(users.email, searchTerm)
              )!,
            ]
          : [])
      );

      const [totalRow] = await db
        .select({ count: count() })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause);

      const rows = await db
        .select({ order: orders, buyerEmail: users.email, sellerName: sellers.brandName })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .innerJoin(sellers, eq(orders.sellerId, sellers.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      return NextResponse.json({
        data: rows.map((row: any) => {
          const { order, buyerEmail, sellerName } = row;
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            buyerEmail,
            sellerName,
            status: order.status,
            currency: order.currency,
            totalCents: order.totalCents,
            paymentRef: order.paymentRef,
            createdAt: order.createdAt.toISOString(),
            deliveryStatus: (order.deliveryStatus as any) ?? null,
            awbNumber: order.awbNumber,
            awbLabelUrl: order.awbLabelUrl,
            deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
            canceledReason: order.canceledReason,
          };
        }),
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      });
    }

    if (role === "buyer") {
      const whereClause = and(
        eq(orders.buyerId, user.id),
        ...(baseConditions.length ? baseConditions : []),
        ...(q ? [ilike(orders.orderNumber, searchTerm)] : [])
      );

      const [totalRow] = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      const rows = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      return NextResponse.json({
        data: rows.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: order.currency,
          totalCents: order.totalCents,
          createdAt: order.createdAt.toISOString(),
          deliveryStatus: (order.deliveryStatus as any) ?? null,
          awbNumber: order.awbNumber,
          awbLabelUrl: order.awbLabelUrl,
          deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
          canceledReason: order.canceledReason,
        })),
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      });
    }

    if (role === "seller") {
      const userSellerIds = await sellerIdsForUser(user.id);
      if (userSellerIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, pageSize });
      }

      const sellerConditions: any[] = [inArray(orderItems.sellerId, userSellerIds)];
      sellerConditions.push(...baseConditions);
      if (q) sellerConditions.push(ilike(orders.orderNumber, searchTerm));

      const [totalRow] = await db
        .select({ count: sql<number>`count(distinct ${orderItems.orderId})` })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...sellerConditions));

      const orderIdRows = await db
        .selectDistinct({ orderId: orderItems.orderId, createdAt: orders.createdAt })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...sellerConditions))
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      const orderIds = orderIdRows.map((r: any) => r.orderId);
      if (orderIds.length === 0) {
        return NextResponse.json({ data: [], total: Number(totalRow?.count ?? 0), page, pageSize });
      }

      const rows = await db
        .select({ order: orders, buyerEmail: users.email })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(inArray(orders.id, orderIds))
        .orderBy(desc(orders.createdAt));

      return NextResponse.json({
        data: rows.map((row: any) => {
          const { order, buyerEmail } = row;
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            buyerEmail,
            status: order.status,
            currency: order.currency,
            totalCents: order.totalCents,
            createdAt: order.createdAt.toISOString(),
            deliveryStatus: (order.deliveryStatus as any) ?? null,
            awbNumber: order.awbNumber,
            awbLabelUrl: order.awbLabelUrl,
            deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
            canceledReason: order.canceledReason,
          };
        }),
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
