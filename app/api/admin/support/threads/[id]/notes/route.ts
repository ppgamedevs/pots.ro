import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportInternalNotes, supportThreads, users } from "@/db/schema/core";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
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
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: supportInternalNotes.id,
        body: supportInternalNotes.body,
        authorId: supportInternalNotes.authorId,
        createdAt: supportInternalNotes.createdAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(supportInternalNotes)
      .leftJoin(users, eq(supportInternalNotes.authorId, users.id))
      .where(eq(supportInternalNotes.threadId, threadId))
      .orderBy(asc(supportInternalNotes.createdAt));

    const notes = rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      body: r.body,
      authorId: r.authorId,
      createdAt: r.createdAt.toISOString(),
      authorName: r.authorName ?? null,
      authorEmail: r.authorEmail ?? null,
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[support/threads/[id]/notes] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Params) {
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
    const noteBody = typeof body?.body === "string" ? body.body.trim() : "";
    if (!noteBody) {
      return NextResponse.json({ error: "body required" }, { status: 400 });
    }

    const [thread] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const [inserted] = await db
      .insert(supportInternalNotes)
      .values({
        threadId,
        body: noteBody,
        authorId: user.id,
      })
      .returning({ id: supportInternalNotes.id, createdAt: supportInternalNotes.createdAt });

    if (!inserted) {
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.thread.note.add",
      entityType: "support_internal_note",
      entityId: inserted.id,
      message: "Added internal note to thread",
      meta: { threadId, noteLength: noteBody.length },
    });

    return NextResponse.json({
      id: inserted.id,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[support/threads/[id]/notes] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
