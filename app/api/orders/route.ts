import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sellers, users } from "@/db/schema/core";
import { and, desc, eq, gte, ilike, lte, or, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.trim() || '';
    const from = searchParams.get('from')?.trim() || '';
    const to = searchParams.get('to')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const dateConditions = [] as any[];
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) dateConditions.push(gte(orders.createdAt, d));
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) dateConditions.push(lte(orders.createdAt, d));
    }

    const searchConditions = [] as any[];
    if (q) {
      const term = `%${q}%`;
      searchConditions.push(
        or(
          ilike(orders.orderNumber, term),
          ilike(users.email, term)
        )!
      );
    }

    const statusConditions = status ? [eq(orders.status, status as any)] : [];
    const baseConditions = [...statusConditions, ...dateConditions, ...searchConditions];

    // Admin/support sees all orders
    if (role === 'admin') {
      if (user.role !== 'admin' && user.role !== 'support') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const [totalRow] = await db
        .select({ count: count() })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause);

      const rows = await db
        .select({
          order: orders,
          buyerEmail: users.email,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      const formatted = rows.map((row: any) => {
        const { order, buyerEmail } = row;
        return {
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        buyerEmail,
        status: order.status as any,
        deliveryStatus: (order.deliveryStatus as any) ?? null,
        awbNumber: order.awbNumber,
        awbLabelUrl: order.awbLabelUrl,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
        canceledReason: order.canceledReason,
        shippingAddress: (order.shippingAddress as any) || {},
        items: [],
        totals: {
          subtotal: order.subtotalCents,
          shipping: order.shippingFeeCents,
          tax: 0,
          total: order.totalCents,
        },
      };
      });

      return NextResponse.json({
        data: formatted,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      });
    }

    if (role === 'buyer') {
      const whereClause = and(
        eq(orders.buyerId, user.id),
        ...(baseConditions.length > 0 ? baseConditions : [])
      );

      const [totalRow] = await db
        .select({ count: count() })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause);

      const rows = await db
        .select({ order: orders, buyerEmail: users.email })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      const formatted = rows.map((row: any) => {
        const { order, buyerEmail } = row;
        return {
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        buyerEmail,
        status: order.status as any,
        deliveryStatus: (order.deliveryStatus as any) ?? null,
        awbNumber: order.awbNumber,
        awbLabelUrl: order.awbLabelUrl,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
        canceledReason: order.canceledReason,
        shippingAddress: (order.shippingAddress as any) || {},
        items: [],
        totals: {
          subtotal: order.subtotalCents,
          shipping: order.shippingFeeCents,
          tax: 0,
          total: order.totalCents,
        },
      };
      });

      return NextResponse.json({ data: formatted, total: Number(totalRow?.count ?? 0), page, pageSize });
    }

    if (role === 'seller') {
      const userSellerIds = await sellerIdsForUser(user.id);
      if (userSellerIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, pageSize });
      }

      const whereClause = and(
        eq(orders.sellerId, userSellerIds[0]),
        ...(baseConditions.length > 0 ? baseConditions : [])
      );

      const [totalRow] = await db
        .select({ count: count() })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause);

      const rows = await db
        .select({ order: orders, buyerEmail: users.email })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset(offset);

      const formatted = rows.map((row: any) => {
        const { order, buyerEmail } = row;
        return {
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        buyerEmail,
        status: order.status as any,
        deliveryStatus: (order.deliveryStatus as any) ?? null,
        awbNumber: order.awbNumber,
        awbLabelUrl: order.awbLabelUrl,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
        canceledReason: order.canceledReason,
        shippingAddress: (order.shippingAddress as any) || {},
        items: [],
        totals: {
          subtotal: order.subtotalCents,
          shipping: order.shippingFeeCents,
          tax: 0,
          total: order.totalCents,
        },
      };
      });

      return NextResponse.json({ data: formatted, total: Number(totalRow?.count ?? 0), page, pageSize });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
