import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messageModeration, messages } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { redactPII } from "@/lib/support/pii-redact";

export const dynamic = "force-dynamic";

type RedactPattern = "email" | "phone" | "iban" | "cnp" | "all";

interface Params {
  params: Promise<{ id: string }>;
}

const VALID_PATTERNS: RedactPattern[] = ["email", "phone", "iban", "cnp", "all"];

export async function POST(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: messageId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { pattern?: string };
    const raw = typeof body?.pattern === "string" ? body.pattern.trim().toLowerCase() : "all";
    const pattern: RedactPattern = VALID_PATTERNS.includes(raw as RedactPattern) ? (raw as RedactPattern) : "all";

    const [message] = await db
      .select({ id: messages.id, body: messages.body })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const patterns = pattern === "all" ? undefined : [pattern];
    const redactedBody = redactPII(message.body, patterns ? { patterns } : undefined);

    const now = new Date();
    const reason = `PII redaction (pattern: ${pattern})`;

    const [existing] = await db
      .select()
      .from(messageModeration)
      .where(eq(messageModeration.messageId, messageId))
      .limit(1);

    if (existing) {
      await db
        .update(messageModeration)
        .set({
          status: "redacted",
          redactedBody,
          reason,
          moderatedByUserId: user.id,
          moderatedAt: now,
          updatedAt: now,
        })
        .where(eq(messageModeration.id, existing.id));
    } else {
      await db.insert(messageModeration).values({
        messageId,
        status: "redacted",
        redactedBody,
        reason,
        moderatedByUserId: user.id,
        moderatedAt: now,
      });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.message.redact",
      entityType: "message",
      entityId: messageId,
      message: "PII quick redaction",
      meta: { pattern },
    });

    return NextResponse.json({ success: true, redactedBody });
  } catch (error) {
    console.error("[support/messages/[id]/redact] POST Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
