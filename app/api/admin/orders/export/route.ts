import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sellers, users } from "@/db/schema/core";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function isoDateOnly(): string {
  return new Date().toISOString().split("T")[0] || "";
}

function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 1) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const domainParts = domain.split(".");
  const domainName = domainParts[0] || "";
  const domainTld = domainParts.slice(1).join(".");
  const localMasked = `${local[0]}***${local[local.length - 1] ?? ""}`;
  const domainMasked = domainName ? `${domainName[0]}***${domainName[domainName.length - 1] ?? ""}` : "***";
  return `${localMasked}@${domainMasked}${domainTld ? `.${domainTld}` : ""}`;
}

function maskToken(value: string): string {
  const v = value.trim();
  if (v.length <= 4) return "****";
  return `****${v.slice(-4)}`;
}

function extractShipping(addr: any) {
  return {
    name: addr?.name ?? addr?.fullName ?? addr?.recipientName ?? "",
    phone: addr?.phone ?? addr?.phoneNumber ?? "",
    city: addr?.city ?? addr?.locality ?? "",
    county: addr?.county ?? addr?.state ?? addr?.region ?? "",
    postalCode: addr?.postalCode ?? addr?.zip ?? "",
    line1: addr?.line1 ?? addr?.address1 ?? addr?.street ?? addr?.address ?? "",
    line2: addr?.line2 ?? addr?.address2 ?? "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "admin" && user.role !== "support") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const from = searchParams.get("from")?.trim() || "";
    const to = searchParams.get("to")?.trim() || "";
    const requestedIncludePii = (searchParams.get("includePii") || "").toLowerCase() === "true";
    const includePii = requestedIncludePii && user.role === "admin";
    const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") || "2000", 10) || 2000));

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

    const rows = await db
      .select({
        order: orders,
        buyerEmail: users.email,
        sellerBrandName: sellers.brandName,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .innerJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "orders_export_csv",
      entityType: "orders",
      entityId: "export",
      message: includePii ? "Export CSV comenzi (include PII)" : "Export CSV comenzi (PII mascat)",
      meta: {
        filters: { status: status || null, q: q || null, from: from || null, to: to || null },
        requestedIncludePii,
        includePii,
        limit,
        returned: rows.length,
      },
    });

    const headers = [
      "createdAt",
      "orderNumber",
      "status",
      "total",
      "currency",
      "buyerEmail",
      "seller",
      "paymentRef",
      "awbNumber",
      "deliveryStatus",
      "deliveredAt",
      "shippingName",
      "shippingPhone",
      "shippingCity",
      "shippingCounty",
      "shippingPostalCode",
      "shippingLine1",
      "shippingLine2",
    ];

    const csv = [
      headers.map(escapeCSVValue).join(","),
      ...rows.map((r: any) => {
        const order = r.order;
        const buyerEmail = String(r.buyerEmail || "");
        const sellerBrandName = String(r.sellerBrandName || "");
        const paymentRef = order.paymentRef ? String(order.paymentRef) : "";
        const ship = extractShipping(order.shippingAddress);

        const safeBuyerEmail = includePii ? buyerEmail : (buyerEmail ? maskEmail(buyerEmail) : "");
        const safePaymentRef = includePii ? paymentRef : (paymentRef ? maskToken(paymentRef) : "");

        const safeShip = includePii
          ? ship
          : {
              name: "",
              phone: "",
              city: "",
              county: "",
              postalCode: "",
              line1: "",
              line2: "",
            };

        return [
          order.createdAt ? new Date(order.createdAt).toISOString() : "",
          order.orderNumber,
          order.status,
          typeof order.totalCents === "number" ? (order.totalCents / 100).toFixed(2) : "",
          order.currency || "RON",
          safeBuyerEmail,
          sellerBrandName,
          safePaymentRef,
          order.awbNumber || "",
          (order.deliveryStatus as any) ?? "",
          order.deliveredAt ? new Date(order.deliveredAt).toISOString() : "",
          safeShip.name,
          safeShip.phone,
          safeShip.city,
          safeShip.county,
          safeShip.postalCode,
          safeShip.line1,
          safeShip.line2,
        ]
          .map(escapeCSVValue)
          .join(",");
      }),
    ].join("\n");

    const filename = `orders_${isoDateOnly()}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Orders export CSV error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
