import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  supportThreads,
  conversations,
  messages,
  messageModeration,
  supportTickets,
  supportTicketMessages,
  supportThreadMessages,
  users,
  orders,
  sellers,
} from "@/db/schema/core";
import { and, eq, asc, inArray } from "drizzle-orm";
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

    // Fetch the thread
    const [thread] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Based on source, fetch messages from the appropriate table
    let threadMessages: any[] = [];

    if (thread.source === "buyer_seller") {
      // Fetch from conversations + messages table
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, thread.sourceId))
        .limit(1);

      if (conversation) {
        const rawMessages = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            body: messages.body,
            createdAt: messages.createdAt,
            senderName: users.name,
            senderEmail: users.email,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(asc(messages.createdAt));

        // Define types for raw message and moderation
        type RawMessage = {
          id: string;
          senderId: string;
          body: string;
          createdAt: Date;
          senderName: string | null;
          senderEmail: string | null;
        };

        type ModerationRecord = {
          id: string;
          messageId: string;
          status: string;
          redactedBody: string | null;
          reason: string | null;
          moderatedByUserId: string | null;
          moderatedAt: Date | null;
          isInternalNote: boolean;
          internalNoteBody: string | null;
          internalNoteByUserId: string | null;
          internalNoteAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        };

        // Get moderation status for all messages
        const messageIds = rawMessages.map((m: RawMessage) => m.id);
        const moderations: ModerationRecord[] = messageIds.length > 0
          ? await db
              .select()
              .from(messageModeration)
              .where(inArray(messageModeration.messageId, messageIds))
          : [];

        const moderationMap = new Map(moderations.map((m: ModerationRecord) => [m.messageId, m]));
        const moderatorIds = [...new Set(moderations.map((m: ModerationRecord) => m.moderatedByUserId).filter(Boolean))] as string[];
        type ModeratorRow = { id: string; name: string | null; email: string };
        const moderatorRows: ModeratorRow[] = moderatorIds.length > 0
          ? await db
              .select({ id: users.id, name: users.name, email: users.email })
              .from(users)
              .where(inArray(users.id, moderatorIds))
          : [];
        const moderatorMap = new Map<string, ModeratorRow>(moderatorRows.map((u: ModeratorRow) => [u.id, u]));

        const roleLabels: Record<string, string> = {
          buyer: "Cumpărător",
          seller: "Vânzător",
          support: "Support",
          admin: "Admin",
        };
        threadMessages = rawMessages.map((msg: RawMessage) => {
          const mod = moderationMap.get(msg.id);
          const moderator = mod?.moderatedByUserId ? moderatorMap.get(mod.moderatedByUserId) ?? null : null;
          const authorDisplayLabel =
            msg.senderId === conversation!.buyerId
              ? roleLabels.buyer
              : msg.senderId === conversation!.sellerId
                ? roleLabels.seller
                : msg.senderName || msg.senderEmail?.split("@")[0] || "—";
          return {
            ...msg,
            authorDisplayLabel,
            moderation: mod
              ? {
                  status: mod.status,
                  redactedBody: mod.redactedBody,
                  reason: mod.reason,
                  moderatedAt: mod.moderatedAt,
                  isInternalNote: mod.isInternalNote,
                  internalNoteBody: mod.internalNoteBody,
                  moderator: moderator ? { id: moderator.id, name: moderator.name, email: moderator.email } : null,
                }
              : null,
            // Show redacted body if message was redacted
            displayBody:
              mod?.status === "redacted"
                ? mod.redactedBody || "[REDACTED]"
                : mod?.status === "deleted" || mod?.status === "hidden"
                ? "[MODERATED]"
                : msg.body,
          };
        });
      }
    } else if (thread.source === "seller_support") {
      // Fetch from support_tickets + support_ticket_messages
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, thread.sourceId))
        .limit(1);

      if (ticket) {
        type TicketMessage = {
          id: string;
          senderId: string;
          body: string;
          createdAt: Date;
          senderName: string | null;
          senderEmail: string | null;
        };

        const [sellerRow] = await db
          .select({ userId: sellers.userId })
          .from(sellers)
          .where(eq(sellers.id, ticket.sellerId))
          .limit(1);
        const sellerUserId = sellerRow?.userId ?? null;

        const ticketMessages: TicketMessage[] = await db
          .select({
            id: supportTicketMessages.id,
            senderId: supportTicketMessages.authorId,
            body: supportTicketMessages.body,
            createdAt: supportTicketMessages.createdAt,
            senderName: users.name,
            senderEmail: users.email,
          })
          .from(supportTicketMessages)
          .leftJoin(users, eq(supportTicketMessages.authorId, users.id))
          .where(eq(supportTicketMessages.ticketId, ticket.id))
          .orderBy(asc(supportTicketMessages.createdAt));

        const roleLabels: Record<string, string> = {
          buyer: "Cumpărător",
          seller: "Vânzător",
          support: "Support",
          admin: "Admin",
        };
        threadMessages = ticketMessages.map((msg: TicketMessage) => {
          const authorDisplayLabel =
            msg.senderId && msg.senderId === sellerUserId ? roleLabels.seller : roleLabels.support;
          return {
            ...msg,
            authorDisplayLabel,
            moderation: null,
            displayBody: msg.body,
          };
        });
      }
    } else if (thread.source === "chatbot" || thread.source === "whatsapp") {
      type SupportThreadMessage = {
        id: string;
        senderId: string | null;
        body: string;
        createdAt: Date;
        senderName: string | null;
        senderEmail: string | null;
        authorRole: string;
        userRole: string | null;
      };

      const roleLabels: Record<string, string> = {
        buyer: "Cumpărător",
        seller: "Vânzător",
        support: "Support",
        admin: "Admin",
      };

      const supportMessages: SupportThreadMessage[] = await db
        .select({
          id: supportThreadMessages.id,
          senderId: supportThreadMessages.authorId,
          body: supportThreadMessages.body,
          createdAt: supportThreadMessages.createdAt,
          senderName: users.name,
          senderEmail: users.email,
          authorRole: supportThreadMessages.authorRole,
          userRole: users.role,
        })
        .from(supportThreadMessages)
        .leftJoin(users, eq(supportThreadMessages.authorId, users.id))
        .where(eq(supportThreadMessages.threadId, thread.id))
        .orderBy(asc(supportThreadMessages.createdAt));

      threadMessages = supportMessages.map((msg) => {
        let authorDisplayLabel: string;
        if (msg.authorRole === "customer") {
          if (!msg.senderId) {
            authorDisplayLabel = "Vizitator";
          } else {
            authorDisplayLabel = (msg.userRole && roleLabels[msg.userRole]) || msg.senderName || msg.senderEmail?.split("@")[0] || "—";
          }
        } else if (msg.authorRole === "support") {
          authorDisplayLabel = roleLabels.support;
        } else if (msg.authorRole === "bot") {
          authorDisplayLabel = "Bot";
        } else {
          authorDisplayLabel = "System";
        }
        return {
          id: msg.id,
          senderId: msg.senderId || "system",
          body: msg.body,
          createdAt: msg.createdAt,
          senderName: msg.senderName,
          senderEmail:
            msg.senderEmail ||
            (msg.authorRole === "customer"
              ? "customer@webchat"
              : msg.authorRole === "support"
                ? "support@floristmarket"
                : "bot@floristmarket"),
          displayBody: msg.body,
          moderation: null,
          authorRole: msg.authorRole,
          authorDisplayLabel,
        };
      });
    }

    // Enrich thread with order, seller, buyer when present
    let orderInfo: { orderNumber: string; status: string } | null = null;
    let sellerInfo: { brandName: string; slug: string } | null = null;
    let buyerInfo: { name: string | null; email: string } | null = null;
    let closedByInfo: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null = null;
    let resolvedByInfo: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null = null;

    if (thread.orderId) {
      const [o] = await db
        .select({ orderNumber: orders.orderNumber, status: orders.status })
        .from(orders)
        .where(eq(orders.id, thread.orderId))
        .limit(1);
      if (o) orderInfo = { orderNumber: o.orderNumber, status: o.status };
    }
    if (thread.sellerId) {
      const [s] = await db
        .select({ brandName: sellers.brandName, slug: sellers.slug })
        .from(sellers)
        .where(eq(sellers.id, thread.sellerId!))
        .limit(1);
      if (s) sellerInfo = { brandName: s.brandName, slug: s.slug };
    }
    if (thread.buyerId) {
      const [b] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, thread.buyerId!))
        .limit(1);
      if (b) buyerInfo = { name: b.name, email: b.email };
    }

    if (thread.closedByUserId) {
      const [u] = await db
        .select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, thread.closedByUserId))
        .limit(1);
      if (u) {
        closedByInfo = {
          id: u.id,
          displayId: u.displayId ?? null,
          name: u.name ?? null,
          email: u.email,
          role: u.role,
        };
      }
    }

    if (thread.resolvedByUserId) {
      const [u] = await db
        .select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, thread.resolvedByUserId))
        .limit(1);
      if (u) {
        resolvedByInfo = {
          id: u.id,
          displayId: u.displayId ?? null,
          name: u.name ?? null,
          email: u.email,
          role: u.role,
        };
      }
    }

    const enrichedThread = {
      ...thread,
      order: orderInfo,
      seller: sellerInfo,
      buyer: buyerInfo,
      closedBy: closedByInfo,
      resolvedBy: resolvedByInfo,
    };

    // Audit the view (for sensitive data access tracking)
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "support.thread.view",
      entityType: "support_thread",
      entityId: threadId,
      message: `Viewed thread messages`,
      meta: { source: thread.source, messageCount: threadMessages.length },
    });

    return NextResponse.json({
      thread: enrichedThread,
      messages: threadMessages,
    });
  } catch (error) {
    console.error("[support/threads/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
