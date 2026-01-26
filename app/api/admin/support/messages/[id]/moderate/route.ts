import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messageModeration, messages, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { autoRedactPII } from "@/lib/support/pii-redact";

export const dynamic = "force-dynamic";

type ModerationAction = "hide" | "delete" | "redact" | "restore" | "addNote";
type ModerationStatus = "visible" | "hidden" | "redacted" | "deleted";

interface Params {
  params: Promise<{ id: string }>;
}

/** RBAC: hide, addNote = admin + support; delete, redact, restore = admin only. */

export async function GET(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: messageId } = await context.params;

    // Get message with moderation info
    const [message] = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Get moderation overlay
    const [moderation] = await db
      .select()
      .from(messageModeration)
      .where(eq(messageModeration.messageId, messageId))
      .limit(1);

    // Get moderator info if exists
    let moderatorInfo = null;
    if (moderation?.moderatedByUserId) {
      const [moderator] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, moderation.moderatedByUserId))
        .limit(1);
      moderatorInfo = moderator;
    }

    return NextResponse.json({
      message,
      moderation: moderation
        ? {
            ...moderation,
            moderator: moderatorInfo,
          }
        : null,
    });
  } catch (error) {
    console.error("[support/messages/[id]/moderate] GET Error:", error);
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

    const { id: messageId } = await context.params;
    const body = await request.json();
    const { action, reason, redactedBody, autoRedact, internalNote } = body as {
      action: ModerationAction;
      reason?: string;
      redactedBody?: string;
      autoRedact?: boolean;
      internalNote?: string;
    };

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    const reasonTrimmed = typeof reason === "string" ? reason.trim() : "";
    if (["hide", "delete", "redact"].includes(action) && !reasonTrimmed) {
      return NextResponse.json(
        { error: "Reason is required for hide, delete, and redact" },
        { status: 400 }
      );
    }

    // Verify message exists
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Get or create moderation overlay
    let [existing] = await db
      .select()
      .from(messageModeration)
      .where(eq(messageModeration.messageId, messageId))
      .limit(1);

    const now = new Date();

    switch (action) {
      case "hide": {
        // Admin/Support can hide messages (soft-delete visible to support only)
        if (existing) {
          await db
            .update(messageModeration)
            .set({
              status: "hidden" as ModerationStatus,
              reason: reasonTrimmed,
              moderatedByUserId: user.id,
              moderatedAt: now,
              updatedAt: now,
            })
            .where(eq(messageModeration.id, existing.id));
        } else {
          await db.insert(messageModeration).values({
            messageId,
            status: "hidden" as ModerationStatus,
            reason: reasonTrimmed,
            moderatedByUserId: user.id,
            moderatedAt: now,
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.message.hide",
          entityType: "message",
          entityId: messageId,
          message: "Hid message from public view",
          meta: { reason: reasonTrimmed },
        });

        return NextResponse.json({ success: true, message: "Message hidden" });
      }

      case "delete": {
        // Admin only can soft-delete (mark as deleted, content preserved but not shown)
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Delete action requires admin role" },
            { status: 403 }
          );
        }

        if (existing) {
          await db
            .update(messageModeration)
            .set({
              status: "deleted" as ModerationStatus,
              reason: reasonTrimmed,
              moderatedByUserId: user.id,
              moderatedAt: now,
              updatedAt: now,
            })
            .where(eq(messageModeration.id, existing.id));
        } else {
          await db.insert(messageModeration).values({
            messageId,
            status: "deleted" as ModerationStatus,
            reason: reasonTrimmed,
            moderatedByUserId: user.id,
            moderatedAt: now,
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.message.delete",
          entityType: "message",
          entityId: messageId,
          message: "Soft-deleted message",
          meta: { reason: reasonTrimmed },
        });

        return NextResponse.json({ success: true, message: "Message deleted" });
      }

      case "redact": {
        // Admin only can redact PII
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Redact action requires admin role" },
            { status: 403 }
          );
        }

        // Calculate redacted body
        let finalRedactedBody = redactedBody;
        if (autoRedact) {
          finalRedactedBody = autoRedactPII(message.body);
        }

        if (!finalRedactedBody) {
          return NextResponse.json(
            { error: "redactedBody or autoRedact required" },
            { status: 400 }
          );
        }

        if (existing) {
          await db
            .update(messageModeration)
            .set({
              status: "redacted" as ModerationStatus,
              redactedBody: finalRedactedBody,
              reason: reasonTrimmed,
              moderatedByUserId: user.id,
              moderatedAt: now,
              updatedAt: now,
            })
            .where(eq(messageModeration.id, existing.id));
        } else {
          await db.insert(messageModeration).values({
            messageId,
            status: "redacted" as ModerationStatus,
            redactedBody: finalRedactedBody,
            reason: reasonTrimmed,
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
          message: "Redacted PII from message",
          meta: { reason: reasonTrimmed, autoRedact },
        });

        return NextResponse.json({
          success: true,
          message: "Message redacted",
          redactedBody: finalRedactedBody,
        });
      }

      case "restore": {
        // Admin only can restore hidden/deleted messages
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Restore action requires admin role" },
            { status: 403 }
          );
        }

        if (!existing) {
          return NextResponse.json({ error: "No moderation to restore" }, { status: 400 });
        }

        await db
          .update(messageModeration)
          .set({
            status: "visible" as ModerationStatus,
            reason: `Restored by admin: ${reason || "No reason provided"}`,
            moderatedByUserId: user.id,
            moderatedAt: now,
            updatedAt: now,
          })
          .where(eq(messageModeration.id, existing.id));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.message.restore",
          entityType: "message",
          entityId: messageId,
          message: "Restored message visibility",
          meta: { reason, prevStatus: existing.status },
        });

        return NextResponse.json({ success: true, message: "Message restored" });
      }

      case "addNote": {
        // Support and admin can add internal notes
        if (!internalNote?.trim()) {
          return NextResponse.json({ error: "internalNote required" }, { status: 400 });
        }

        if (existing) {
          await db
            .update(messageModeration)
            .set({
              isInternalNote: true,
              internalNoteBody: internalNote.trim(),
              internalNoteByUserId: user.id,
              internalNoteAt: now,
              updatedAt: now,
            })
            .where(eq(messageModeration.id, existing.id));
        } else {
          await db.insert(messageModeration).values({
            messageId,
            status: "visible" as ModerationStatus,
            isInternalNote: true,
            internalNoteBody: internalNote.trim(),
            internalNoteByUserId: user.id,
            internalNoteAt: now,
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.message.addNote",
          entityType: "message",
          entityId: messageId,
          message: "Added internal note",
          meta: { noteLength: internalNote.trim().length },
        });

        return NextResponse.json({ success: true, message: "Internal note added" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[support/messages/[id]/moderate] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
