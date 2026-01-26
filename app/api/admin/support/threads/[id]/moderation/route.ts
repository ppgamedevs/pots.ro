import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  supportThreads,
  conversations,
  messages,
  messageModeration,
  users,
} from "@/db/schema/core";
import { eq, inArray, desc, and, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

function preview(text: string | null, max = 80): string {
  if (!text || typeof text !== "string") return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length <= max ? s : s.slice(0, max) + "…";
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: threadId } = await context.params;

    const [thread] = await db
      .select({ id: supportThreads.id, source: supportThreads.source, sourceId: supportThreads.sourceId })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.source !== "buyer_seller") {
      return NextResponse.json({ events: [] });
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, thread.sourceId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ events: [] });
    }

    const rawMessages = await db
      .select({ id: messages.id, body: messages.body })
      .from(messages)
      .where(eq(messages.conversationId, conversation.id));

    type MsgRow = { id: string; body: string };
    const messageIds = rawMessages.map((m: MsgRow) => m.id);
    const bodyMap = new Map(rawMessages.map((m: MsgRow) => [m.id, m.body]));

    if (messageIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const modRows = await db
      .select({
        messageId: messageModeration.messageId,
        status: messageModeration.status,
        reason: messageModeration.reason,
        redactedBody: messageModeration.redactedBody,
        moderatedByUserId: messageModeration.moderatedByUserId,
        moderatedAt: messageModeration.moderatedAt,
        moderatorId: users.id,
        moderatorName: users.name,
        moderatorEmail: users.email,
      })
      .from(messageModeration)
      .leftJoin(users, eq(messageModeration.moderatedByUserId, users.id))
      .where(
        and(
          inArray(messageModeration.messageId, messageIds),
          ne(messageModeration.status, "visible")
        )
      )
      .orderBy(desc(messageModeration.moderatedAt));

    type ModRow = (typeof modRows)[number];
    const events = modRows.map((r: ModRow) => {
      const body = bodyMap.get(r.messageId) ?? null;
      const messagePreview = preview(
        r.status === "redacted" && r.redactedBody ? r.redactedBody : body
      );
      return {
        messageId: r.messageId,
        messagePreview: messagePreview || undefined,
        status: r.status,
        reason: r.reason ?? undefined,
        moderatedBy: r.moderatedByUserId
          ? {
              id: r.moderatorId ?? r.moderatedByUserId,
              name: r.moderatorName ?? null,
              email: r.moderatorEmail ?? null,
            }
          : null,
        moderatedAt: r.moderatedAt?.toISOString() ?? undefined,
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[support/threads/[id]/moderation] GET Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
