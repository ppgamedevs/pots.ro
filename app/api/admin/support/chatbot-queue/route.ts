import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatbotQueue, supportThreads, users } from "@/db/schema/core";
import {
  and,
  eq,
  gte,
  lte,
  desc,
  asc,
  sql,
  inArray,
  isNull,
  isNotNull,
} from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

type QueueStatus = "pending" | "processing" | "handed_off" | "resolved" | "rejected";

interface QueueFilters {
  status?: QueueStatus[];
  assignedToUserId?: string;
  promptInjectionSuspected?: boolean;
  from?: Date;
  to?: Date;
}

function parseFilters(searchParams: URLSearchParams): QueueFilters {
  const filters: QueueFilters = {};

  const statusParam = searchParams.get("status");
  if (statusParam) {
    const statuses = statusParam.split(",").filter((s) =>
      ["pending", "processing", "handed_off", "resolved", "rejected"].includes(s)
    ) as QueueStatus[];
    if (statuses.length > 0) filters.status = statuses;
  }

  const assignedToUserId = searchParams.get("assignedToUserId");
  if (assignedToUserId?.trim()) filters.assignedToUserId = assignedToUserId.trim();

  const promptInjection = searchParams.get("promptInjectionSuspected");
  if (promptInjection === "true") filters.promptInjectionSuspected = true;
  if (promptInjection === "false") filters.promptInjectionSuspected = false;

  const from = searchParams.get("from");
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      filters.from = d;
    }
  }

  const to = searchParams.get("to");
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      filters.to = d;
    }
  }

  return filters;
}

// GET - List chatbot queue items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build conditions
    const conditions: any[] = [];

    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(chatbotQueue.status, filters.status));
    } else {
      // Default: show pending items
      conditions.push(eq(chatbotQueue.status, "pending"));
    }

    if (filters.assignedToUserId) {
      if (filters.assignedToUserId === "unassigned") {
        conditions.push(isNull(chatbotQueue.assignedToUserId));
      } else {
        conditions.push(eq(chatbotQueue.assignedToUserId, filters.assignedToUserId));
      }
    }

    if (filters.promptInjectionSuspected !== undefined) {
      conditions.push(
        eq(chatbotQueue.promptInjectionSuspected, filters.promptInjectionSuspected)
      );
    }

    if (filters.from) {
      conditions.push(gte(chatbotQueue.createdAt, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(chatbotQueue.createdAt, filters.to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatbotQueue)
      .where(whereClause);

    const total = countRow?.count ?? 0;

    // Build sort order
    const sortColumn =
      sortBy === "confidence"
        ? chatbotQueue.confidence
        : sortBy === "updatedAt"
        ? chatbotQueue.updatedAt
        : chatbotQueue.createdAt;

    const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Define queue item type
    type QueueItemRow = {
      id: string;
      threadId: string | null;
      conversationId: string | null;
      userId: string | null;
      status: string;
      intent: string | null;
      confidence: string | null;
      lastBotResponse: string | null;
      userQuery: string | null;
      handoffReason: string | null;
      assignedToUserId: string | null;
      resolvedByUserId: string | null;
      resolvedAt: Date | null;
      promptInjectionSuspected: boolean;
      createdAt: Date;
      updatedAt: Date;
      assignedToName: string | null;
      assignedToEmail: string | null;
    };

    // Get queue items with assignee info
    const items: QueueItemRow[] = await db
      .select({
        id: chatbotQueue.id,
        threadId: chatbotQueue.threadId,
        conversationId: chatbotQueue.conversationId,
        userId: chatbotQueue.userId,
        status: chatbotQueue.status,
        intent: chatbotQueue.intent,
        confidence: chatbotQueue.confidence,
        lastBotResponse: chatbotQueue.lastBotResponse,
        userQuery: chatbotQueue.userQuery,
        handoffReason: chatbotQueue.handoffReason,
        assignedToUserId: chatbotQueue.assignedToUserId,
        resolvedByUserId: chatbotQueue.resolvedByUserId,
        resolvedAt: chatbotQueue.resolvedAt,
        promptInjectionSuspected: chatbotQueue.promptInjectionSuspected,
        createdAt: chatbotQueue.createdAt,
        updatedAt: chatbotQueue.updatedAt,
        // Joined assignee info
        assignedToName: users.name,
        assignedToEmail: users.email,
      })
      .from(chatbotQueue)
      .leftJoin(users, eq(chatbotQueue.assignedToUserId, users.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get user info for queue items
    const userIds = [...new Set(items.map((i: QueueItemRow) => i.userId).filter(Boolean))] as string[];
    const userMap = new Map<string, { name: string | null; email: string }>();

    if (userIds.length > 0) {
      const userInfo: { id: string; name: string | null; email: string }[] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds));
      userInfo.forEach((u: { id: string; name: string | null; email: string }) => userMap.set(u.id, { name: u.name, email: u.email }));
    }

    // Enrich items
    const data = items.map((item) => ({
      ...item,
      user: item.userId ? userMap.get(item.userId) : null,
    }));

    // Get stats
    const [stats] = await db
      .select({
        pending: sql<number>`count(*) FILTER (WHERE status = 'pending')::int`,
        processing: sql<number>`count(*) FILTER (WHERE status = 'processing')::int`,
        promptInjection: sql<number>`count(*) FILTER (WHERE prompt_injection_suspected = true AND status = 'pending')::int`,
      })
      .from(chatbotQueue);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      stats: {
        pending: stats?.pending ?? 0,
        processing: stats?.processing ?? 0,
        promptInjectionSuspected: stats?.promptInjection ?? 0,
      },
    });
  } catch (error) {
    console.error("[support/chatbot-queue] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Actions on queue items (assign, handoff, resolve, requeue, flag)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { queueId, action, ...params } = body;

    if (!queueId) {
      return NextResponse.json({ error: "queueId required" }, { status: 400 });
    }

    // Fetch queue item
    const [item] = await db
      .select()
      .from(chatbotQueue)
      .where(eq(chatbotQueue.id, queueId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    const now = new Date();

    switch (action) {
      case "assign": {
        const { assignToUserId } = params;

        await db
          .update(chatbotQueue)
          .set({
            assignedToUserId: assignToUserId || null,
            status: assignToUserId ? "processing" : "pending",
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.assign",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: assignToUserId
            ? `Assigned chatbot queue item to ${assignToUserId}`
            : "Unassigned chatbot queue item",
          meta: { assignToUserId },
        });

        return NextResponse.json({ success: true, message: "Queue item assigned" });
      }

      case "handoff": {
        // Force handoff to human support (create support thread if needed)
        const { handoffReason } = params;

        // Create or update support thread
        let threadId = item.threadId;
        if (!threadId) {
          const [newThread] = await db
            .insert(supportThreads)
            .values({
              source: "chatbot",
              sourceId: item.conversationId || item.id,
              buyerId: item.userId,
              status: "open",
              priority: "high",
              subject: `Chatbot handoff: ${item.intent || "Unknown intent"}`,
              lastMessagePreview: item.userQuery,
              messageCount: 1,
            })
            .returning();
          threadId = newThread.id;
        }

        await db
          .update(chatbotQueue)
          .set({
            status: "handed_off",
            threadId,
            handoffReason: handoffReason || item.handoffReason,
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.handoff",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: "Handed off chatbot conversation to human support",
          meta: { threadId, handoffReason },
        });

        return NextResponse.json({
          success: true,
          message: "Conversation handed off to support",
          threadId,
        });
      }

      case "resolve": {
        const { resolution } = params;

        await db
          .update(chatbotQueue)
          .set({
            status: "resolved",
            resolvedByUserId: user.id,
            resolvedAt: now,
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.resolve",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: "Resolved chatbot queue item",
          meta: { resolution },
        });

        return NextResponse.json({ success: true, message: "Queue item resolved" });
      }

      case "reject": {
        // Reject item (e.g., spam, test, invalid)
        const { rejectionReason } = params;

        await db
          .update(chatbotQueue)
          .set({
            status: "rejected",
            resolvedByUserId: user.id,
            resolvedAt: now,
            handoffReason: rejectionReason,
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.reject",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: "Rejected chatbot queue item",
          meta: { rejectionReason },
        });

        return NextResponse.json({ success: true, message: "Queue item rejected" });
      }

      case "requeue": {
        // Put back in pending queue
        await db
          .update(chatbotQueue)
          .set({
            status: "pending",
            assignedToUserId: null,
            resolvedByUserId: null,
            resolvedAt: null,
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.requeue",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: "Requeued chatbot queue item",
        });

        return NextResponse.json({ success: true, message: "Queue item requeued" });
      }

      case "flagPromptInjection": {
        // Flag as prompt injection suspected
        const { suspected } = params;
        const flagValue = suspected !== false;

        await db
          .update(chatbotQueue)
          .set({
            promptInjectionSuspected: flagValue,
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, queueId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.chatbot.flagPromptInjection",
          entityType: "chatbot_queue",
          entityId: queueId,
          message: flagValue
            ? "Flagged as potential prompt injection"
            : "Cleared prompt injection flag",
          meta: { userQuery: item.userQuery },
        });

        return NextResponse.json({
          success: true,
          message: flagValue ? "Flagged as prompt injection" : "Flag cleared",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[support/chatbot-queue] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
