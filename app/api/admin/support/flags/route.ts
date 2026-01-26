import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  conversationFlagsExtended,
  conversationFlags,
  conversations,
  users,
  orders,
  supportThreads,
} from "@/db/schema/core";
import { and, eq, desc, sql, or, isNotNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { logThreadModeration } from "@/lib/support/moderation-history";

export const dynamic = "force-dynamic";

// GET - List flagged conversations (bypass suspected or fraud suspected)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Only admin and security roles can view flags
    if (!["admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const filter = searchParams.get("filter"); // 'bypass', 'fraud', 'escalated', 'all'
    const conversationId = searchParams.get("conversationId");

    // If specific conversationId requested
    if (conversationId) {
      // Get basic flags from conversationFlags
      const [basicFlags] = await db
        .select()
        .from(conversationFlags)
        .where(eq(conversationFlags.conversationId, conversationId))
        .limit(1);

      // Get extended flags
      const [extendedFlags] = await db
        .select()
        .from(conversationFlagsExtended)
        .where(eq(conversationFlagsExtended.conversationId, conversationId))
        .limit(1);

      // Audit the read
      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "support.flags.view",
        entityType: "conversation",
        entityId: conversationId,
        message: "Viewed conversation flags",
      });

      return NextResponse.json({
        conversationId,
        basicFlags: basicFlags || null,
        extendedFlags: extendedFlags || null,
      });
    }

    // Build conditions for listing flagged conversations
    const conditions: any[] = [];

    if (filter === "bypass") {
      // Get conversations with bypass suspected (from original flags table)
      const flaggedConversations = await db
        .select({
          conversationId: conversationFlags.conversationId,
          bypassSuspected: conversationFlags.bypassSuspected,
          attempts24h: conversationFlags.attempts24h,
          updatedAt: conversationFlags.updatedAt,
        })
        .from(conversationFlags)
        .where(eq(conversationFlags.bypassSuspected, true))
        .orderBy(desc(conversationFlags.updatedAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(conversationFlags)
        .where(eq(conversationFlags.bypassSuspected, true));

      return NextResponse.json({
        data: flaggedConversations,
        total: countRow?.count ?? 0,
        page,
        limit,
        filter: "bypass",
      });
    }

    if (filter === "fraud") {
      // Get conversations with fraud suspected (from extended flags)
      const fraudFlagged = await db
        .select({
          id: conversationFlagsExtended.id,
          conversationId: conversationFlagsExtended.conversationId,
          fraudSuspected: conversationFlagsExtended.fraudSuspected,
          fraudReason: conversationFlagsExtended.fraudReason,
          fraudDetectedAt: conversationFlagsExtended.fraudDetectedAt,
          escalatedAt: conversationFlagsExtended.escalatedAt,
          createdAt: conversationFlagsExtended.createdAt,
        })
        .from(conversationFlagsExtended)
        .where(eq(conversationFlagsExtended.fraudSuspected, true))
        .orderBy(desc(conversationFlagsExtended.fraudDetectedAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(conversationFlagsExtended)
        .where(eq(conversationFlagsExtended.fraudSuspected, true));

      return NextResponse.json({
        data: fraudFlagged,
        total: countRow?.count ?? 0,
        page,
        limit,
        filter: "fraud",
      });
    }

    if (filter === "escalated") {
      // Get escalated conversations
      const escalated = await db
        .select({
          id: conversationFlagsExtended.id,
          conversationId: conversationFlagsExtended.conversationId,
          escalatedToUserId: conversationFlagsExtended.escalatedToUserId,
          escalatedAt: conversationFlagsExtended.escalatedAt,
          escalationReason: conversationFlagsExtended.escalationReason,
          escalatedToName: users.name,
          escalatedToEmail: users.email,
        })
        .from(conversationFlagsExtended)
        .leftJoin(users, eq(conversationFlagsExtended.escalatedToUserId, users.id))
        .where(isNotNull(conversationFlagsExtended.escalatedToUserId))
        .orderBy(desc(conversationFlagsExtended.escalatedAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(conversationFlagsExtended)
        .where(isNotNull(conversationFlagsExtended.escalatedToUserId));

      return NextResponse.json({
        data: escalated,
        total: countRow?.count ?? 0,
        page,
        limit,
        filter: "escalated",
      });
    }

    // Default: all flagged (either bypass or fraud or escalated)
    // This is a union-style query
    const allFlagged = await db
      .select({
        id: conversationFlagsExtended.id,
        conversationId: conversationFlagsExtended.conversationId,
        fraudSuspected: conversationFlagsExtended.fraudSuspected,
        fraudReason: conversationFlagsExtended.fraudReason,
        escalatedToUserId: conversationFlagsExtended.escalatedToUserId,
        escalatedAt: conversationFlagsExtended.escalatedAt,
        updatedAt: conversationFlagsExtended.updatedAt,
      })
      .from(conversationFlagsExtended)
      .where(
        or(
          eq(conversationFlagsExtended.fraudSuspected, true),
          isNotNull(conversationFlagsExtended.escalatedToUserId)
        )
      )
      .orderBy(desc(conversationFlagsExtended.updatedAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationFlagsExtended)
      .where(
        or(
          eq(conversationFlagsExtended.fraudSuspected, true),
          isNotNull(conversationFlagsExtended.escalatedToUserId)
        )
      );

    return NextResponse.json({
      data: allFlagged,
      total: countRow?.count ?? 0,
      page,
      limit,
      filter: "all",
    });
  } catch (error) {
    console.error("[support/flags] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Set/update flags on a conversation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Only admin can set flags
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { conversationId, action, ...params } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    // Verify conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const now = new Date();

    // Get or create extended flags
    let [existing] = await db
      .select()
      .from(conversationFlagsExtended)
      .where(eq(conversationFlagsExtended.conversationId, conversationId))
      .limit(1);

    switch (action) {
      case "setFraud": {
        const { fraudSuspected, fraudReason, evidenceJson } = params;

        if (existing) {
          await db
            .update(conversationFlagsExtended)
            .set({
              fraudSuspected: fraudSuspected ?? existing.fraudSuspected,
              fraudReason: fraudReason ?? existing.fraudReason,
              fraudDetectedAt: fraudSuspected ? now : existing.fraudDetectedAt,
              fraudDetectedByUserId: fraudSuspected ? user.id : existing.fraudDetectedByUserId,
              evidenceJson: evidenceJson ?? existing.evidenceJson,
              updatedAt: now,
            })
            .where(eq(conversationFlagsExtended.id, existing.id));
        } else {
          await db.insert(conversationFlagsExtended).values({
            conversationId,
            fraudSuspected: fraudSuspected ?? false,
            fraudReason,
            fraudDetectedAt: fraudSuspected ? now : null,
            fraudDetectedByUserId: fraudSuspected ? user.id : null,
            evidenceJson: evidenceJson ?? {},
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.flags.setFraud",
          entityType: "conversation",
          entityId: conversationId,
          message: fraudSuspected
            ? `Marked conversation as fraud suspected: ${fraudReason}`
            : "Cleared fraud suspicion",
          meta: { fraudSuspected, fraudReason },
        });

        return NextResponse.json({
          success: true,
          message: fraudSuspected ? "Fraud flag set" : "Fraud flag cleared",
        });
      }

      case "escalate": {
        const { escalateToUserId, escalationReason } = params;

        if (!escalateToUserId) {
          return NextResponse.json({ error: "escalateToUserId required" }, { status: 400 });
        }

        if (existing) {
          await db
            .update(conversationFlagsExtended)
            .set({
              escalatedToUserId: escalateToUserId,
              escalatedAt: now,
              escalationReason,
              updatedAt: now,
            })
            .where(eq(conversationFlagsExtended.id, existing.id));
        } else {
          await db.insert(conversationFlagsExtended).values({
            conversationId,
            escalatedToUserId: escalateToUserId,
            escalatedAt: now,
            escalationReason,
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.flags.escalate",
          entityType: "conversation",
          entityId: conversationId,
          message: `Escalated conversation to ${escalateToUserId}`,
          meta: { escalateToUserId, escalationReason },
        });

        // Find threadId for this conversation
        let threadId: string | null = null;
        try {
          const [thread] = await db
            .select({ id: supportThreads.id })
            .from(supportThreads)
            .where(eq(supportThreads.sourceId, conversationId))
            .limit(1);
          threadId = thread?.id || null;
        } catch {
          threadId = null;
        }

        await logThreadModeration({
          actorId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role as "admin" | "support",
          actionType: "thread.escalate",
          threadId: threadId || conversationId, // Fallback to conversationId if thread not found
          reason: null,
          note: escalationReason || `Escalated to ${escalateToUserId}`,
          metadata: { escalateToUserId, escalationReason, conversationId },
        });

        return NextResponse.json({ success: true, message: "Conversation escalated" });
      }

      case "deescalate": {
        if (!existing) {
          return NextResponse.json({ error: "No flags to de-escalate" }, { status: 400 });
        }

        const prevEscalatedTo = existing.escalatedToUserId;

        await db
          .update(conversationFlagsExtended)
          .set({
            escalatedToUserId: null,
            escalatedAt: null,
            escalationReason: null,
            updatedAt: now,
          })
          .where(eq(conversationFlagsExtended.id, existing.id));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.flags.deescalate",
          entityType: "conversation",
          entityId: conversationId,
          message: "De-escalated conversation",
          meta: { prevEscalatedTo },
        });

        // Find threadId for this conversation
        let threadId: string | null = null;
        try {
          const [thread] = await db
            .select({ id: supportThreads.id })
            .from(supportThreads)
            .where(eq(supportThreads.sourceId, conversationId))
            .limit(1);
          threadId = thread?.id || null;
        } catch {
          threadId = null;
        }

        await logThreadModeration({
          actorId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role as "admin" | "support",
          actionType: "thread.deescalate",
          threadId: threadId || conversationId, // Fallback to conversationId if thread not found
          reason: null,
          note: `De-escalated from ${prevEscalatedTo}`,
          metadata: { prevEscalatedTo, conversationId },
        });

        return NextResponse.json({ success: true, message: "Conversation de-escalated" });
      }

      case "addEvidence": {
        const { evidence } = params;

        if (!evidence) {
          return NextResponse.json({ error: "evidence required" }, { status: 400 });
        }

        const currentEvidence = (existing?.evidenceJson as any) || {};
        const newEvidence = {
          ...currentEvidence,
          entries: [
            ...(currentEvidence.entries || []),
            {
              addedBy: user.id,
              addedAt: now.toISOString(),
              content: evidence,
            },
          ],
        };

        if (existing) {
          await db
            .update(conversationFlagsExtended)
            .set({
              evidenceJson: newEvidence,
              updatedAt: now,
            })
            .where(eq(conversationFlagsExtended.id, existing.id));
        } else {
          await db.insert(conversationFlagsExtended).values({
            conversationId,
            evidenceJson: newEvidence,
          });
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.flags.addEvidence",
          entityType: "conversation",
          entityId: conversationId,
          message: "Added evidence to conversation flags",
          meta: { evidenceType: typeof evidence },
        });

        return NextResponse.json({ success: true, message: "Evidence added" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[support/flags] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
