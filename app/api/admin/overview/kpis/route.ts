import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, payouts, refunds, orderItems, products } from "@/db/schema/core";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

interface KPIFilters {
  from?: Date;
  to?: Date;
  sellerId?: string;
  categoryId?: string;
}

function parseFilters(searchParams: URLSearchParams): KPIFilters {
  const filters: KPIFilters = {};

  const from = searchParams.get("from");
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      filters.from = d;
    }
  }

  const to = searchParams.get("to");
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      filters.to = d;
    }
  }

  const sellerId = searchParams.get("sellerId");
  if (sellerId?.trim()) {
    filters.sellerId = sellerId.trim();
  }

  const categoryId = searchParams.get("categoryId");
  if (categoryId?.trim()) {
    filters.categoryId = categoryId.trim();
  }

  return filters;
}

async function getProductsInCategory(categoryId: string): Promise<string[]> {
  // Get products directly in this category
  // Note: For deep hierarchy traversal, you'd need recursive CTE or path column
  const productsInCat = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, categoryId));

  return productsInCat.map((p: { id: string }) => p.id);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);

    // Build base conditions for orders
    const orderConditions: any[] = [];
    if (filters.from) orderConditions.push(gte(orders.createdAt, filters.from));
    if (filters.to) orderConditions.push(lte(orders.createdAt, filters.to));
    if (filters.sellerId) orderConditions.push(eq(orders.sellerId, filters.sellerId));

    // For category filtering, we need to filter by products in that category
    let productIdsFilter: string[] | null = null;
    if (filters.categoryId) {
      productIdsFilter = await getProductsInCategory(filters.categoryId);
      if (productIdsFilter.length === 0) {
        // No products in category - return zeros
        return NextResponse.json({
          kpis: {
            gmvCents: 0,
            orderCount: 0,
            avgOrderValueCents: 0,
            commissionTotalCents: 0,
            refundRatePct: 0,
            payoutBacklogCents: 0,
            ordersPerDay: 0,
          },
          filters: {
            from: filters.from?.toISOString() ?? null,
            to: filters.to?.toISOString() ?? null,
            sellerId: filters.sellerId ?? null,
            categoryId: filters.categoryId ?? null,
          },
          generatedAt: new Date().toISOString(),
        });
      }
    }

    // When filtering by category, get order IDs that include products in that category
    let ordersInCategory: string[] = [];
    if (productIdsFilter && productIdsFilter.length > 0) {
      const orderItemsInCat = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(inArray(orderItems.productId, productIdsFilter))
        .groupBy(orderItems.orderId);
      ordersInCategory = orderItemsInCat.map((oi: { orderId: string }) => oi.orderId);
      if (ordersInCategory.length === 0) {
        return NextResponse.json({
          kpis: {
            gmvCents: 0,
            orderCount: 0,
            avgOrderValueCents: 0,
            commissionTotalCents: 0,
            refundRatePct: 0,
            payoutBacklogCents: 0,
            ordersPerDay: 0,
          },
          filters: {
            from: filters.from?.toISOString() ?? null,
            to: filters.to?.toISOString() ?? null,
            sellerId: filters.sellerId ?? null,
            categoryId: filters.categoryId ?? null,
          },
          generatedAt: new Date().toISOString(),
        });
      }
    }

    // Combine conditions
    const finalOrderConditions = [...orderConditions];
    if (ordersInCategory.length > 0) {
      finalOrderConditions.push(inArray(orders.id, ordersInCategory));
    }

    const whereClause = finalOrderConditions.length > 0 ? and(...finalOrderConditions) : undefined;

    // 1. GMV, Order Count, AOV
    // Only count paid+ orders for GMV
    const paidStatuses = ['paid', 'packed', 'shipped', 'delivered'];
    const paidCondition = inArray(orders.status, paidStatuses as any);
    const paidWhereClause = whereClause ? and(whereClause, paidCondition) : paidCondition;

    const [ordersAgg] = await db
      .select({
        gmvCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(paidWhereClause);

    const gmvCents = Number(ordersAgg?.gmvCents ?? 0);
    const orderCount = ordersAgg?.orderCount ?? 0;
    const avgOrderValueCents = orderCount > 0 ? Math.round(gmvCents / orderCount) : 0;

    // 2. Commission total from payouts
    const payoutConditions: any[] = [];
    if (filters.from) payoutConditions.push(gte(payouts.createdAt, filters.from));
    if (filters.to) payoutConditions.push(lte(payouts.createdAt, filters.to));
    if (filters.sellerId) payoutConditions.push(eq(payouts.sellerId, filters.sellerId));
    if (ordersInCategory.length > 0) payoutConditions.push(inArray(payouts.orderId, ordersInCategory));

    const payoutsWhereClause = payoutConditions.length > 0 ? and(...payoutConditions) : undefined;

    const [payoutsAgg] = await db
      .select({
        commissionTotalCents: sql<number>`coalesce(sum(cast(${payouts.commissionAmount} * 100 as bigint)), 0)::bigint`,
      })
      .from(payouts)
      .where(payoutsWhereClause);

    const commissionTotalCents = Number(payoutsAgg?.commissionTotalCents ?? 0);

    // 3. Refund rate
    const refundConditions: any[] = [];
    if (filters.from) refundConditions.push(gte(refunds.createdAt, filters.from));
    if (filters.to) refundConditions.push(lte(refunds.createdAt, filters.to));
    if (ordersInCategory.length > 0) refundConditions.push(inArray(refunds.orderId, ordersInCategory));

    const refundsWhereClause = refundConditions.length > 0 ? and(...refundConditions) : undefined;

    const [refundsAgg] = await db
      .select({
        refundCount: sql<number>`count(*)::int`,
      })
      .from(refunds)
      .where(refundsWhereClause);

    const refundCount = refundsAgg?.refundCount ?? 0;
    const refundRatePct = orderCount > 0 ? Math.round((refundCount / orderCount) * 10000) / 100 : 0;

    // 4. Payout backlog (pending/processing payouts)
    const payoutBacklogConditions: any[] = [
      inArray(payouts.status, ['pending', 'processing'] as any),
    ];
    // Don't filter by date for backlog - we want current backlog
    if (filters.sellerId) payoutBacklogConditions.push(eq(payouts.sellerId, filters.sellerId));

    const [backlogAgg] = await db
      .select({
        backlogCents: sql<number>`coalesce(sum(cast(${payouts.amount} * 100 as bigint)), 0)::bigint`,
      })
      .from(payouts)
      .where(and(...payoutBacklogConditions));

    const payoutBacklogCents = Number(backlogAgg?.backlogCents ?? 0);

    // 5. Orders per day
    let ordersPerDay = 0;
    if (filters.from && filters.to) {
      const daysDiff = Math.max(1, Math.ceil((filters.to.getTime() - filters.from.getTime()) / (1000 * 60 * 60 * 24)));
      ordersPerDay = Math.round((orderCount / daysDiff) * 100) / 100;
    } else if (orderCount > 0) {
      // Get first and last order dates to calculate average
      const [datesAgg] = await db
        .select({
          firstOrder: sql<Date>`min(${orders.createdAt})`,
          lastOrder: sql<Date>`max(${orders.createdAt})`,
        })
        .from(orders)
        .where(paidWhereClause);

      if (datesAgg?.firstOrder && datesAgg?.lastOrder) {
        const firstDate = new Date(datesAgg.firstOrder);
        const lastDate = new Date(datesAgg.lastOrder);
        const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        ordersPerDay = Math.round((orderCount / daysDiff) * 100) / 100;
      }
    }

    return NextResponse.json({
      kpis: {
        gmvCents,
        orderCount,
        avgOrderValueCents,
        commissionTotalCents,
        refundRatePct,
        payoutBacklogCents,
        ordersPerDay,
      },
      filters: {
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
        sellerId: filters.sellerId ?? null,
        categoryId: filters.categoryId ?? null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
