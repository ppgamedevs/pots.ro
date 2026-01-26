import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportThreadTags, supportThreads } from "@/db/schema/core";
import { and, eq, inArray } from "drizzle-orm";
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

    const body = await request.json().catch(() => ({}));
    const toAdd = Array.isArray(body?.add) ? body.add : [];
    const toRemove = Array.isArray(body?.remove) ? body.remove : [];

    for (const tag of toAdd) {
      const t = typeof tag === "string" ? tag.trim().toLowerCase() : "";
      if (!t) continue;
      try {
        await db.insert(supportThreadTags).values({ threadId, tag: t });
        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.addTag",
          entityType: "support_thread",
          entityId: threadId,
          message: `Added tag "${t}"`,
          meta: { tag: t },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (!msg.includes("duplicate") && !msg.includes("unique")) throw err;
      }
    }

    for (const tag of toRemove) {
      const t = typeof tag === "string" ? tag.trim().toLowerCase() : "";
      if (!t) continue;
      await db
        .delete(supportThreadTags)
        .where(
          and(
            eq(supportThreadTags.threadId, threadId),
            eq(supportThreadTags.tag, t)
          )
        );
      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "support.thread.removeTag",
        entityType: "support_thread",
        entityId: threadId,
        message: `Removed tag "${t}"`,
        meta: { tag: t },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[support/threads/[id]/tags] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
