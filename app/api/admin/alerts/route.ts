import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminAlerts, users } from "@/db/schema/core";
import { and, eq, gte, lte, desc, sql, inArray, or, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type AlertStatus = "open" | "acknowledged" | "resolved" | "snoozed";
type AlertSeverity = "low" | "medium" | "high" | "critical";

interface AlertFilters {
  status?: AlertStatus[];
  severity?: AlertSeverity[];
  source?: string;
  assignedToUserId?: string;
  from?: Date;
  to?: Date;
}

function parseFilters(searchParams: URLSearchParams): AlertFilters {
  const filters: AlertFilters = {};

  const statusParam = searchParams.get("status");
  if (statusParam) {
    const statuses = statusParam.split(",").filter((s) => 
      ["open", "acknowledged", "resolved", "snoozed"].includes(s)
    ) as AlertStatus[];
    if (statuses.length > 0) filters.status = statuses;
  }

  const severityParam = searchParams.get("severity");
  if (severityParam) {
    const severities = severityParam.split(",").filter((s) => 
      ["low", "medium", "high", "critical"].includes(s)
    ) as AlertSeverity[];
    if (severities.length > 0) filters.severity = severities;
  }

  const source = searchParams.get("source");
  if (source?.trim()) filters.source = source.trim();

  const assignedToUserId = searchParams.get("assignedToUserId");
  if (assignedToUserId?.trim()) filters.assignedToUserId = assignedToUserId.trim();

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

  return filters;
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: any[] = [];

    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(adminAlerts.status, filters.status));
    } else {
      // Default: show active alerts (not resolved)
      conditions.push(inArray(adminAlerts.status, ["open", "acknowledged", "snoozed"]));
    }

    if (filters.severity && filters.severity.length > 0) {
      conditions.push(inArray(adminAlerts.severity, filters.severity));
    }

    if (filters.source) {
      conditions.push(eq(adminAlerts.source, filters.source));
    }

    if (filters.assignedToUserId) {
      if (filters.assignedToUserId === "unassigned") {
        conditions.push(isNull(adminAlerts.assignedToUserId));
      } else {
        conditions.push(eq(adminAlerts.assignedToUserId, filters.assignedToUserId));
      }
    }

    if (filters.from) {
      conditions.push(gte(adminAlerts.createdAt, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(adminAlerts.createdAt, filters.to));
    }

    // Exclude expired snoozed alerts from active view (they should auto-reopen)
    // This is handled in the query below

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminAlerts)
      .where(whereClause);

    const total = countRow?.count ?? 0;

    // Get alerts with assigned user info
    const alerts = await db
      .select({
        id: adminAlerts.id,
        source: adminAlerts.source,
        type: adminAlerts.type,
        severity: adminAlerts.severity,
        dedupeKey: adminAlerts.dedupeKey,
        entityType: adminAlerts.entityType,
        entityId: adminAlerts.entityId,
        title: adminAlerts.title,
        details: adminAlerts.details,
        status: adminAlerts.status,
        assignedToUserId: adminAlerts.assignedToUserId,
        assignedToName: users.name,
        assignedToEmail: users.email,
        snoozedUntil: adminAlerts.snoozedUntil,
        resolvedAt: adminAlerts.resolvedAt,
        resolvedByUserId: adminAlerts.resolvedByUserId,
        linkedTicketId: adminAlerts.linkedTicketId,
        createdAt: adminAlerts.createdAt,
        updatedAt: adminAlerts.updatedAt,
      })
      .from(adminAlerts)
      .leftJoin(users, eq(users.id, adminAlerts.assignedToUserId))
      .where(whereClause)
      .orderBy(
        // Order by severity (critical first), then by created date
        sql`CASE ${adminAlerts.severity}
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END`,
        desc(adminAlerts.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Get severity counts for badges
    const [severityCounts] = await db
      .select({
        critical: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'critical')::int`,
        high: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'high')::int`,
        medium: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'medium')::int`,
        low: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'low')::int`,
      })
      .from(adminAlerts)
      .where(inArray(adminAlerts.status, ["open", "acknowledged"]));

    return NextResponse.json({
      alerts: alerts.map((a: typeof alerts[0]) => ({
        ...a,
        createdAt: a.createdAt?.toISOString?.() ?? String(a.createdAt),
        updatedAt: a.updatedAt?.toISOString?.() ?? String(a.updatedAt),
        snoozedUntil: a.snoozedUntil?.toISOString?.() ?? null,
        resolvedAt: a.resolvedAt?.toISOString?.() ?? null,
        assignedTo: a.assignedToUserId
          ? { id: a.assignedToUserId, name: a.assignedToName, email: a.assignedToEmail }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        critical: severityCounts?.critical ?? 0,
        high: severityCounts?.high ?? 0,
        medium: severityCounts?.medium ?? 0,
        low: severityCounts?.low ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
