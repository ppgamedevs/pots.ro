import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatbotQueue, supportThreadMessages, supportThreads } from "@/db/schema/core";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "admin" && user.role !== "support") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: threadId } = await context.params;
    const body = await request.json();
    const messageBody = typeof body?.body === "string" ? body.body.trim() : "";

    if (!messageBody) {
      return NextResponse.json({ error: "body required" }, { status: 400 });
    }

    const now = new Date();

    await db.insert(supportThreadMessages).values({
      threadId,
      authorId: user.id,
      authorRole: "support",
      body: messageBody,
      createdAt: now,
    });

    await db
      .update(supportThreads)
      .set({
        lastMessageAt: now,
        lastMessagePreview: messageBody.slice(0, 200),
        messageCount: sql`${supportThreads.messageCount} + 1`,
        updatedAt: now,
        // Auto-assign if unassigned
        assignedToUserId: sql`COALESCE(${supportThreads.assignedToUserId}, ${user.id}::uuid)`,
        status: sql`CASE WHEN ${supportThreads.status} = 'open' THEN 'assigned'::support_thread_status ELSE ${supportThreads.status} END`,
      })
      .where(eq(supportThreads.id, threadId));

    await db
      .update(chatbotQueue)
      .set({
        status: "handed_off",
        assignedToUserId: user.id,
        updatedAt: now,
      })
      .where(eq(chatbotQueue.threadId, threadId));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.thread.reply",
      entityType: "support_thread",
      entityId: threadId,
      message: "Sent support reply",
      meta: { length: messageBody.length },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[support/threads/[id]/reply] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
