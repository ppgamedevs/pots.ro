import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportThreads } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

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
      .select({
        slaDeadline: supportThreads.slaDeadline,
        slaBreach: supportThreads.slaBreach,
      })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({
      slaDeadline: thread.slaDeadline?.toISOString() ?? null,
      slaBreach: thread.slaBreach,
    });
  } catch (error) {
    console.error("[support/threads/[id]/sla] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
