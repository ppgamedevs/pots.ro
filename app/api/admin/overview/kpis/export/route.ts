import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, payouts, refunds, orderItems, products } from "@/db/schema/core";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

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

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

async function getProductsInCategory(categoryId: string): Promise<string[]> {
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

    // Check rate limit for exports
    const rateLimitReq = new Request(request.url, {
      headers: new Headers([...request.headers.entries(), ["x-user-id", user.id]]),
    }) as unknown as NextRequest;
    
    const rateLimitResult = await checkRateLimit(rateLimitReq, "admin_exports");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response ?? NextResponse.json(
        { error: "Rate limit exceeded. Please wait before exporting again." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);

    // Build conditions (same as kpis endpoint)
    const orderConditions: any[] = [];
    if (filters.from) orderConditions.push(gte(orders.createdAt, filters.from));
    if (filters.to) orderConditions.push(lte(orders.createdAt, filters.to));
    if (filters.sellerId) orderConditions.push(eq(orders.sellerId, filters.sellerId));

    let productIdsFilter: string[] | null = null;
    if (filters.categoryId) {
      productIdsFilter = await getProductsInCategory(filters.categoryId);
    }

    let ordersInCategory: string[] | null = null;
    if (productIdsFilter && productIdsFilter.length > 0) {
      const orderItemsInCat = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(inArray(orderItems.productId, productIdsFilter))
        .groupBy(orderItems.orderId);
      ordersInCategory = orderItemsInCat.map((oi: { orderId: string }) => oi.orderId);
    }

    const finalOrderConditions = [...orderConditions];
    if (ordersInCategory && ordersInCategory.length > 0) {
      finalOrderConditions.push(inArray(orders.id, ordersInCategory));
    }

    const whereClause = finalOrderConditions.length > 0 ? and(...finalOrderConditions) : undefined;
    const paidStatuses = ['paid', 'packed', 'shipped', 'delivered'];
    const paidCondition = inArray(orders.status, paidStatuses as any);
    const paidWhereClause = whereClause ? and(whereClause, paidCondition) : paidCondition;

    // Aggregate KPIs
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

    // Commission
    const payoutConditions: any[] = [];
    if (filters.from) payoutConditions.push(gte(payouts.createdAt, filters.from));
    if (filters.to) payoutConditions.push(lte(payouts.createdAt, filters.to));
    if (filters.sellerId) payoutConditions.push(eq(payouts.sellerId, filters.sellerId));
    if (ordersInCategory && ordersInCategory.length > 0) {
      payoutConditions.push(inArray(payouts.orderId, ordersInCategory));
    }

    const payoutsWhereClause = payoutConditions.length > 0 ? and(...payoutConditions) : undefined;

    const [payoutsAgg] = await db
      .select({
        commissionTotalCents: sql<number>`coalesce(sum(cast(${payouts.commissionAmount} * 100 as bigint)), 0)::bigint`,
      })
      .from(payouts)
      .where(payoutsWhereClause);

    const commissionTotalCents = Number(payoutsAgg?.commissionTotalCents ?? 0);

    // Refunds
    const refundConditions: any[] = [];
    if (filters.from) refundConditions.push(gte(refunds.createdAt, filters.from));
    if (filters.to) refundConditions.push(lte(refunds.createdAt, filters.to));
    if (ordersInCategory && ordersInCategory.length > 0) {
      refundConditions.push(inArray(refunds.orderId, ordersInCategory));
    }

    const refundsWhereClause = refundConditions.length > 0 ? and(...refundConditions) : undefined;

    const [refundsAgg] = await db
      .select({
        refundCount: sql<number>`count(*)::int`,
      })
      .from(refunds)
      .where(refundsWhereClause);

    const refundCount = refundsAgg?.refundCount ?? 0;
    const refundRatePct = orderCount > 0 ? Math.round((refundCount / orderCount) * 10000) / 100 : 0;

    // Payout backlog
    const payoutBacklogConditions: any[] = [
      inArray(payouts.status, ['pending', 'processing'] as any),
    ];
    if (filters.sellerId) payoutBacklogConditions.push(eq(payouts.sellerId, filters.sellerId));

    const [backlogAgg] = await db
      .select({
        backlogCents: sql<number>`coalesce(sum(cast(${payouts.amount} * 100 as bigint)), 0)::bigint`,
      })
      .from(payouts)
      .where(and(...payoutBacklogConditions));

    const payoutBacklogCents = Number(backlogAgg?.backlogCents ?? 0);

    // Orders per day
    let ordersPerDay = 0;
    if (filters.from && filters.to) {
      const daysDiff = Math.max(1, Math.ceil((filters.to.getTime() - filters.from.getTime()) / (1000 * 60 * 60 * 24)));
      ordersPerDay = Math.round((orderCount / daysDiff) * 100) / 100;
    }

    // Build CSV
    const headers = [
      "KPI",
      "Value",
      "Unit",
      "Period From",
      "Period To",
      "Seller Filter",
      "Category Filter",
      "Generated At",
    ];

    const dateFrom = filters.from?.toISOString().split("T")[0] ?? "All time";
    const dateTo = filters.to?.toISOString().split("T")[0] ?? "Now";
    const generatedAt = new Date().toISOString();

    const rows = [
      ["GMV", formatCurrency(gmvCents), "RON", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
      ["Order Count", String(orderCount), "orders", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
      ["AOV", formatCurrency(avgOrderValueCents), "RON", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
      ["Commission Total", formatCurrency(commissionTotalCents), "RON", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
      ["Refund Rate", String(refundRatePct), "%", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
      ["Payout Backlog", formatCurrency(payoutBacklogCents), "RON", "Current", "Current", filters.sellerId ?? "-", "-", generatedAt],
      ["Orders/Day", String(ordersPerDay), "orders/day", dateFrom, dateTo, filters.sellerId ?? "-", filters.categoryId ?? "-", generatedAt],
    ];

    const csvContent = [
      headers.map(escapeCSVValue).join(","),
      ...rows.map((row) => row.map(escapeCSVValue).join(",")),
    ].join("\n");

    // Audit the export
    await writeAdminAudit({
      actorId: user.id,
      action: "kpi_export",
      entityType: "overview",
      entityId: "kpi_export", // No specific entity, use action as ID
      meta: {
        filters: {
          from: filters.from?.toISOString() ?? null,
          to: filters.to?.toISOString() ?? null,
          sellerId: filters.sellerId ?? null,
          categoryId: filters.categoryId ?? null,
        },
        kpis: {
          gmvCents,
          orderCount,
          avgOrderValueCents,
          commissionTotalCents,
          refundRatePct,
          payoutBacklogCents,
          ordersPerDay,
        },
      },
    });

    const filename = `kpis_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error exporting KPIs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
