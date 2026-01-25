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
} from "@/db/schema/core";
import { and, eq, desc, asc } from "drizzle-orm";
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
              .where(eq(messageModeration.messageId, messageIds[0])) // TODO: inArray when multiple
          : [];

        const moderationMap = new Map(moderations.map((m: ModerationRecord) => [m.messageId, m]));

        threadMessages = rawMessages.map((msg: RawMessage) => {
          const mod = moderationMap.get(msg.id);
          return {
            ...msg,
            moderation: mod
              ? {
                  status: mod.status,
                  redactedBody: mod.redactedBody,
                  reason: mod.reason,
                  moderatedAt: mod.moderatedAt,
                  isInternalNote: mod.isInternalNote,
                  internalNoteBody: mod.internalNoteBody,
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

        threadMessages = ticketMessages.map((msg: TicketMessage) => ({
          ...msg,
          moderation: null,
          displayBody: msg.body,
        }));
      }
    } else if (thread.source === "chatbot" || thread.source === "whatsapp") {
      type SupportThreadMessage = {
        id: string;
        senderId: string;
        body: string;
        createdAt: Date;
        senderName: string | null;
        senderEmail: string | null;
        authorRole: string;
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
        })
        .from(supportThreadMessages)
        .leftJoin(users, eq(supportThreadMessages.authorId, users.id))
        .where(eq(supportThreadMessages.threadId, thread.id))
        .orderBy(asc(supportThreadMessages.createdAt));

      threadMessages = supportMessages.map((msg) => ({
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
      }));
    }

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
      thread,
      messages: threadMessages,
    });
  } catch (error) {
    console.error("[support/threads/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
