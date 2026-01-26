import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportThreads } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    let assigneeId = body?.assigneeId;
    if (assigneeId === "me") assigneeId = user.id;
    const unassign = assigneeId === null || assigneeId === undefined;
    const validUuid = typeof assigneeId === "string" && UUID_REGEX.test(assigneeId.trim());

    if (!unassign && !validUuid) {
      return NextResponse.json(
        { error: "assigneeId must be a UUID, 'me', or null to unassign" },
        { status: 400 }
      );
    }

    const [thread] = await db
      .select({ id: supportThreads.id, assignedToUserId: supportThreads.assignedToUserId })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const newAssigneeId = unassign ? null : assigneeId.trim();
    await db
      .update(supportThreads)
      .set({
        assignedToUserId: newAssigneeId,
        status: newAssigneeId ? "assigned" : "open",
        updatedAt: new Date(),
      })
      .where(eq(supportThreads.id, threadId));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.thread.assign",
      entityType: "support_thread",
      entityId: threadId,
      message: newAssigneeId ? `Assigned thread to ${newAssigneeId}` : "Unassigned thread",
      meta: { assigneeId: newAssigneeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[support/threads/[id]/assignee] PATCH Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
