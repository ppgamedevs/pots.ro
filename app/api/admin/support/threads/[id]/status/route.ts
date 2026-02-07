import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportThreads } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { logThreadModeration } from "@/lib/support/moderation-history";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["open", "assigned", "waiting", "resolved", "closed", "active"] as const;

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: threadId } = await context.params;

    const body = await request.json().catch(() => ({}));
    const status = typeof body?.status === "string" ? body.status.trim() : "";
    if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid status. Use: open, assigned, waiting, resolved, closed, active" },
        { status: 400 }
      );
    }

    const [thread] = await db
      .select({
        id: supportThreads.id,
        status: supportThreads.status,
        assignedToUserId: supportThreads.assignedToUserId,
        closedByUserId: supportThreads.closedByUserId,
        resolvedByUserId: supportThreads.resolvedByUserId,
      })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date();
    const nextFields: Partial<typeof supportThreads.$inferInsert> = {
      status: status as (typeof VALID_STATUSES)[number],
      updatedAt: now,
    };

    if ((status === "closed" || status === "resolved") && thread.status !== status) {
      // Unassign when closing/resolving
      nextFields.assignedToUserId = null;
      if (status === "closed") {
        nextFields.closedByUserId = user.id;
      }
      if (status === "resolved") {
        nextFields.resolvedByUserId = user.id;
      }
    }

    // When changing to "open" from "resolved" or "closed", assign to current user and clear closed/resolved by fields
    if (status === "open" && (thread.status === "closed" || thread.status === "resolved")) {
      nextFields.assignedToUserId = user.id;
      nextFields.closedByUserId = null;
      nextFields.resolvedByUserId = null;
    }

    await db
      .update(supportThreads)
      .set(nextFields)
      .where(eq(supportThreads.id, threadId));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.thread.status",
      entityType: "support_thread",
      entityId: threadId,
      message: `Changed thread status to ${status}`,
      meta: { prevStatus: thread.status, newStatus: status },
    });

    await logThreadModeration({
      actorId: user.id,
      actorName: user.name || user.email,
      actorRole: user.role as "admin" | "support",
      actionType: "thread.statusChange",
      threadId,
      reason: null,
      note: `Status changed from ${thread.status} to ${status}`,
      metadata: { prevStatus: thread.status, newStatus: status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[support/threads/[id]/status] PATCH Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
