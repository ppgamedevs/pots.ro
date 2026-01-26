import { db } from "@/db";
import { supportModerationHistory, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";

export type ModerationActionType =
  | "message.hide"
  | "message.delete"
  | "message.redact"
  | "message.restore"
  | "message.addNote"
  | "message.redactPII"
  | "thread.statusChange"
  | "thread.priorityChange"
  | "thread.assign"
  | "thread.unassign"
  | "thread.escalate"
  | "thread.deescalate"
  | "user.block"
  | "user.unblock"
  | "other";

export type ModerationEntityType = "message" | "thread" | "user" | "conversation";

export type ModerationActorRole = "admin" | "support" | "bot" | "system";

export interface WriteModerationHistoryParams {
  // Who
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: ModerationActorRole;
  // What
  actionType: ModerationActionType;
  // Where
  entityType: ModerationEntityType;
  entityId: string;
  threadId?: string | null;
  // Why
  reason?: string | null;
  note?: string | null;
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Write an immutable moderation history entry.
 * This function never throws - it logs errors but doesn't block the main action.
 */
export async function writeModerationHistory(
  params: WriteModerationHistoryParams
): Promise<void> {
  try {
    // Resolve actor name if actorId is provided but actorName is not
    let actorName = params.actorName;
    if (params.actorId && !actorName) {
      try {
        const [user] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, params.actorId))
          .limit(1);
        actorName = user?.name || user?.email || "Unknown";
      } catch {
        actorName = "Unknown";
      }
    }

    // If no actor info, default to "System"
    if (!params.actorId && !params.actorName) {
      actorName = "System";
    }

    await db.insert(supportModerationHistory).values({
      actorId: params.actorId || null,
      actorName: actorName || null,
      actorRole: params.actorRole || null,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      threadId: params.threadId || null,
      reason: params.reason || null,
      note: params.note || null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    // Never block core action on moderation history failures
    console.warn("[moderationHistory] Failed to write moderation history:", err);
  }
}

/**
 * Helper to write moderation history for message actions
 */
export async function logMessageModeration(params: {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: ModerationActorRole;
  actionType: "message.hide" | "message.delete" | "message.redact" | "message.restore" | "message.addNote" | "message.redactPII";
  messageId: string;
  threadId?: string | null;
  reason?: string | null;
  note?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  await writeModerationHistory({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actionType: params.actionType,
    entityType: "message",
    entityId: params.messageId,
    threadId: params.threadId,
    reason: params.reason,
    note: params.note,
    metadata: params.metadata,
  });
}

/**
 * Helper to write moderation history for thread actions
 */
export async function logThreadModeration(params: {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: ModerationActorRole;
  actionType: "thread.statusChange" | "thread.priorityChange" | "thread.assign" | "thread.unassign" | "thread.escalate" | "thread.deescalate";
  threadId: string;
  reason?: string | null;
  note?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  await writeModerationHistory({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actionType: params.actionType,
    entityType: "thread",
    entityId: params.threadId,
    threadId: params.threadId,
    reason: params.reason,
    note: params.note,
    metadata: params.metadata,
  });
}
