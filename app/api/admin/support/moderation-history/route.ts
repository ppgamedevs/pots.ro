import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportModerationHistory } from "@/db/schema/core";
import { and, eq, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");
    const actorId = searchParams.get("actorId");
    const actionType = searchParams.get("actionType");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (threadId) {
      conditions.push(eq(supportModerationHistory.threadId, threadId));
    }

    if (actorId) {
      conditions.push(eq(supportModerationHistory.actorId, actorId));
    }

    if (actionType) {
      const actions = actionType.split(",").filter(Boolean);
      if (actions.length > 0) {
        conditions.push(inArray(supportModerationHistory.actionType, actions as any));
      }
    }

    if (entityType) {
      conditions.push(eq(supportModerationHistory.entityType, entityType as any));
    }

    if (entityId) {
      conditions.push(eq(supportModerationHistory.entityId, entityId));
    }

    if (startDate) {
      try {
        const start = new Date(startDate);
        conditions.push(gte(supportModerationHistory.createdAt, start));
      } catch {
        // Invalid date, ignore
      }
    }

    if (endDate) {
      try {
        const end = new Date(endDate);
        // Add one day to include the entire end date
        end.setDate(end.getDate() + 1);
        conditions.push(lte(supportModerationHistory.createdAt, end));
      } catch {
        // Invalid date, ignore
      }
    }

    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportModerationHistory)
      .where(whereClause);

    const total = Number(countResult?.count ?? 0);

    // Get paginated results
    const history = await db
      .select({
        id: supportModerationHistory.id,
        actorId: supportModerationHistory.actorId,
        actorName: supportModerationHistory.actorName,
        actorRole: supportModerationHistory.actorRole,
        actionType: supportModerationHistory.actionType,
        entityType: supportModerationHistory.entityType,
        entityId: supportModerationHistory.entityId,
        threadId: supportModerationHistory.threadId,
        reason: supportModerationHistory.reason,
        note: supportModerationHistory.note,
        metadata: supportModerationHistory.metadata,
        createdAt: supportModerationHistory.createdAt,
      })
      .from(supportModerationHistory)
      .where(whereClause)
      .orderBy(desc(supportModerationHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[support/moderation-history] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
