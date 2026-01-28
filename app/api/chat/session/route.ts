import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportThreadMessages, supportThreads, users } from "@/db/schema/core";
import { and, asc, eq } from "drizzle-orm";
import {
  getOutsideHoursNoticeRo,
  isWithinSupportHoursRo,
} from "@/lib/support/business-hours";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const within = isWithinSupportHoursRo();

    // Find existing support thread for this webchat session.
    const [thread] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(and(eq(supportThreads.source, "chatbot"), eq(supportThreads.sourceId, sessionId)))
      .limit(1);

    type MessageRow = {
      id: string;
      body: string;
      createdAt: Date;
      authorRole: string;
      authorName: string | null;
      authorEmail: string | null;
    };

    const messageRows: MessageRow[] = thread
      ? await db
          .select({
            id: supportThreadMessages.id,
            body: supportThreadMessages.body,
            createdAt: supportThreadMessages.createdAt,
            authorRole: supportThreadMessages.authorRole,
            authorName: users.name,
            authorEmail: users.email,
          })
          .from(supportThreadMessages)
          .leftJoin(users, eq(supportThreadMessages.authorId, users.id))
          .where(eq(supportThreadMessages.threadId, thread.id))
          .orderBy(asc(supportThreadMessages.createdAt))
      : [];

    const messages = messageRows.map((m) => ({
      id: m.id,
      text: m.body,
      sender: m.authorRole === "customer" ? "user" : "bot",
      timestamp: m.createdAt.toISOString(),
      meta: {
        authorRole: m.authorRole,
        authorName: m.authorName,
        authorEmail: m.authorEmail,
      },
    }));

    return NextResponse.json({
      session_id: sessionId,
      mode: "human",
      notice: within ? null : getOutsideHoursNoticeRo(),
      thread_id: thread?.id ?? null,
      messages,
    });
  } catch (error) {
    console.error("[api/chat/session] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
