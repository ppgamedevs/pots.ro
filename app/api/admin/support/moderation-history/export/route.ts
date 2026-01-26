import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportModerationHistory } from "@/db/schema/core";
import { and, eq, desc, gte, lte, inArray } from "drizzle-orm";
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json"; // 'json' or 'csv'

    // Build conditions (same as main endpoint)
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
        end.setDate(end.getDate() + 1);
        conditions.push(lte(supportModerationHistory.createdAt, end));
      } catch {
        // Invalid date, ignore
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all results (no pagination for export)
    const history = await db
      .select()
      .from(supportModerationHistory)
      .where(whereClause)
      .orderBy(desc(supportModerationHistory.createdAt));

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "ID",
        "When",
        "Who (ID)",
        "Who (Name)",
        "Who (Role)",
        "Action Type",
        "Entity Type",
        "Entity ID",
        "Thread ID",
        "Reason",
        "Note",
        "Metadata",
      ];

      const rows = history.map((entry: typeof history[0]) => [
        entry.id,
        entry.createdAt.toISOString(),
        entry.actorId || "",
        entry.actorName || "",
        entry.actorRole || "",
        entry.actionType,
        entry.entityType,
        entry.entityId,
        entry.threadId || "",
        entry.reason || "",
        entry.note || "",
        JSON.stringify(entry.metadata || {}),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="moderation-history-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // JSON format
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        exportedBy: {
          id: user.id,
          name: user.name || user.email,
          role: user.role,
        },
        filters: {
          threadId,
          actorId,
          actionType,
          entityType,
          startDate,
          endDate,
        },
        total: history.length,
        data: history,
      });
    }
  } catch (error) {
    console.error("[support/moderation-history/export] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
