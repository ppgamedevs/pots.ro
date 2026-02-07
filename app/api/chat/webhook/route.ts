/**
 * Chat Webhook Handler
 * Handles messages from web chat interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatbotQueue, supportThreadMessages, supportThreads } from '@/db/schema/core';
import { and, desc, eq, inArray, not, sql } from 'drizzle-orm';
import {
  getOutsideHoursNoticeRo,
  isWithinSupportHoursRo,
} from '@/lib/support/business-hours';
import { supportEventEmitter } from '@/lib/support/event-emitter';

// Ensure Node.js runtime for event emitter compatibility (SSE requires same runtime)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ChatMessage {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  order_id?: string;
}

export interface ChatSession {
  session_id: string;
  user_id?: string;
  phone?: string;
  email?: string;
  messages: ChatMessage[];
  current_order_id?: string;
}

/**
 * POST /api/chat/webhook - Handle web chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const { message, session_id, conversation_id, client_message_id, user_id, phone, email } = await request.json();
    
    if (!message || !session_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const withinSupportHours = isWithinSupportHoursRo();
    const now = new Date();
    const isUserIdUuid = typeof user_id === 'string' && UUID_RE.test(user_id);

    const clientMessageId: string | null =
      typeof client_message_id === 'string' && UUID_RE.test(client_message_id)
        ? client_message_id
        : null;

    // Resolve conversationId and thread: same user → same open thread; closed → new thread.
    let conversationId: string;
    let threadId: string | undefined;

    if (isUserIdUuid) {
      // Logged-in: find open thread for this user (exclude closed/resolved).
      const [openThread] = await db
        .select({ id: supportThreads.id, sourceId: supportThreads.sourceId })
        .from(supportThreads)
        .where(
          and(
            eq(supportThreads.source, 'chatbot'),
            eq(supportThreads.buyerId, user_id),
            not(inArray(supportThreads.status, ['closed', 'resolved']))
          )
        )
        .orderBy(desc(supportThreads.lastMessageAt))
        .limit(1);

      if (openThread) {
        threadId = openThread.id;
        conversationId = openThread.sourceId;
      } else {
        conversationId = crypto.randomUUID();
        const [newThread] = await db
          .insert(supportThreads)
          .values({
            source: 'chatbot',
            sourceId: conversationId,
            buyerId: user_id,
            status: 'waiting',
            priority: 'normal',
            subject: email ? `Webchat: ${email}` : 'Webchat: Vizitator',
            lastMessageAt: now,
            lastMessagePreview: String(message).slice(0, 200),
            messageCount: 0,
            updatedAt: now,
          })
          .returning({ id: supportThreads.id });
        threadId = newThread.id;
      }
    } else {
      // Anonymous: use client session_id / conversation_id; if thread exists and is closed → new thread.
      const clientId =
        typeof conversation_id === 'string' && UUID_RE.test(conversation_id)
          ? conversation_id
          : UUID_RE.test(session_id)
            ? session_id
            : crypto.randomUUID();

      const [existingThread] = await db
        .select({ id: supportThreads.id, sourceId: supportThreads.sourceId, status: supportThreads.status })
        .from(supportThreads)
        .where(and(eq(supportThreads.source, 'chatbot'), eq(supportThreads.sourceId, clientId)))
        .limit(1);

      if (existingThread && (existingThread.status === 'closed' || existingThread.status === 'resolved')) {
        conversationId = crypto.randomUUID();
        const [newThread] = await db
          .insert(supportThreads)
          .values({
            source: 'chatbot',
            sourceId: conversationId,
            buyerId: null,
            status: 'waiting',
            priority: 'normal',
            subject: email ? `Webchat: ${email}` : 'Webchat: Vizitator',
            lastMessageAt: now,
            lastMessagePreview: String(message).slice(0, 200),
            messageCount: 0,
            updatedAt: now,
          })
          .returning({ id: supportThreads.id });
        threadId = newThread.id;
      } else if (existingThread) {
        threadId = existingThread.id;
        conversationId = existingThread.sourceId;
      } else {
        conversationId = clientId;
        const [newThread] = await db
          .insert(supportThreads)
          .values({
            source: 'chatbot',
            sourceId: conversationId,
            buyerId: null,
            status: 'waiting',
            priority: 'normal',
            subject: email ? `Webchat: ${email}` : 'Webchat: Vizitator',
            lastMessageAt: now,
            lastMessagePreview: String(message).slice(0, 200),
            messageCount: 0,
            updatedAt: now,
          })
          .returning({ id: supportThreads.id });
        threadId = newThread.id;
      }
    }

    if (!threadId) {
      throw new Error('Failed to ensure support thread for webchat session');
    }

    // Store customer message in thread transcript (idempotent if client_message_id is provided)
    const customerInsert = clientMessageId
      ? db
          .insert(supportThreadMessages)
          .values({
            id: clientMessageId,
            threadId,
            authorId: isUserIdUuid ? user_id : null,
            authorRole: 'customer',
            body: String(message),
            createdAt: now,
          })
          .onConflictDoNothing({ target: supportThreadMessages.id })
      : db.insert(supportThreadMessages).values({
          threadId,
          authorId: isUserIdUuid ? user_id : null,
          authorRole: 'customer',
          body: String(message),
          createdAt: now,
        });

    const insertedCustomer = await customerInsert.returning({ id: supportThreadMessages.id });
    const didInsertCustomer = Boolean(insertedCustomer?.[0]?.id);

    // Update thread counters/preview (only if this message is new)
    if (didInsertCustomer) {
      // Preserve open/assigned status while still ensuring that closed/resolved/active
      // threads move back into the waiting queue when a new customer message arrives.
      // However, respect a grace period to prevent race conditions where delayed webhooks
      // overwrite recent status changes (e.g., admin just closed/resolved the thread).
      let currentStatus: string | null = null;
      let threadUpdatedAt: Date | null = null;
      try {
        const [threadRow] = await db
          .select({ 
            status: supportThreads.status,
            updatedAt: supportThreads.updatedAt,
          })
          .from(supportThreads)
          .where(eq(supportThreads.id, threadId))
          .limit(1);
        currentStatus = threadRow?.status ?? null;
        threadUpdatedAt = threadRow?.updatedAt ?? null;
      } catch {
        // If we can't read the current status, we'll fall back to marking as waiting below.
      }

      // Grace period: if thread was recently updated (within 10 seconds) and is closed/resolved,
      // preserve the status to prevent race conditions with delayed webhooks overwriting recent status changes.
      const GRACE_PERIOD_MS = 10_000; // 10 seconds
      const isRecentlyUpdated = threadUpdatedAt && 
        (now.getTime() - threadUpdatedAt.getTime()) < GRACE_PERIOD_MS;
      const isClosedOrResolved = currentStatus === "closed" || currentStatus === "resolved";
      
      // Only change status if:
      // 1. Thread is not closed/resolved, OR
      // 2. Thread is closed/resolved but was NOT recently updated (allowing legitimate reopen)
      const shouldChangeStatus = !isClosedOrResolved || !isRecentlyUpdated;

      const nextStatus = shouldChangeStatus
        ? (!currentStatus ||
           currentStatus === "resolved" ||
           currentStatus === "closed" ||
           currentStatus === "active"
             ? "waiting"
             : currentStatus)
        : currentStatus; // Preserve current status if recently updated

      await db
        .update(supportThreads)
        .set({
          lastMessageAt: now,
          lastMessagePreview: String(message).slice(0, 200),
          messageCount: sql`${supportThreads.messageCount} + 1`,
          updatedAt: now,
          status: nextStatus,
        })
        .where(eq(supportThreads.id, threadId));

      // Emit event to notify connected SSE clients about the new message
      // This triggers instant refresh of the Support Threads list
      // Emit for ALL new messages regardless of status to ensure list refreshes
      // Minimal delay (50ms) ensures DB transaction commits and is visible to subsequent queries
      const webhookStartTime = Date.now();
      const dbUpdateTime = Date.now();
      console.log('[Webhook] Preparing to emit SSE event:', {
        threadId,
        status: nextStatus,
        messagePreview: String(message).slice(0, 50),
        timestamp: dbUpdateTime,
        subscriberCountBefore: supportEventEmitter.getSubscriberCount()
      });
      
      setTimeout(() => {
        // Ensure threadId and nextStatus are defined (should always be at this point, but TypeScript needs this check)
        if (!threadId || !nextStatus) {
          console.error('[Webhook] Cannot emit SSE event - threadId or nextStatus is undefined/null', { threadId, nextStatus });
          return;
        }
        const subscriberCount = supportEventEmitter.getSubscriberCount();
        const emitTime = Date.now();
        const delayFromDbUpdate = emitTime - dbUpdateTime;
        
        console.log('[Webhook] About to emit SSE event:', {
          threadId,
          status: nextStatus,
          subscribers: subscriberCount,
          dbUpdateTime,
          emitTime,
          delayFromDbUpdate,
          totalDelayFromWebhook: emitTime - webhookStartTime
        });
        
        supportEventEmitter.emit(threadId, nextStatus);
        
        const afterEmitTime = Date.now();
        console.log('[Webhook] SSE event emitted:', {
          threadId,
          status: nextStatus,
          subscribers: subscriberCount,
          emitTime,
          afterEmitTime,
          emitDuration: afterEmitTime - emitTime,
          totalDelayFromWebhook: afterEmitTime - webhookStartTime
        });
        
        // Warn if no subscribers (SSE connection might not be established)
        if (subscriberCount === 0) {
          console.warn('[Webhook] No SSE subscribers connected. Event was emitted but no clients will receive it.', {
            threadId,
            status: nextStatus,
            suggestion: 'Ensure the Support Threads page (/support) is open and SSE connection is established',
            runtime: 'nodejs',
            eventEmitterType: 'in-memory'
          });
        } else {
          console.log('[Webhook] Event should be delivered to clients:', {
            threadId,
            status: nextStatus,
            subscriberCount,
            expectedDeliveryTime: afterEmitTime + 50 // Immediate refresh (minimal delay)
          });
        }
      }, 50); // 50ms delay to ensure DB transaction commits and is visible (minimal delay for immediate refresh)
    }

    // Always route to human support (chatbot disabled).
    // Create or update a single active queue item per conversation (avoid spamming queue).
    const [existingQueue] = await db
      .select({ id: chatbotQueue.id })
      .from(chatbotQueue)
      .where(
        and(
          eq(chatbotQueue.conversationId, conversationId),
          inArray(chatbotQueue.status, ['pending', 'processing'])
        )
      )
      .orderBy(desc(chatbotQueue.updatedAt))
      .limit(1);

    const handoffReason = withinSupportHours ? 'business_hours_human_available' : 'outside_hours_message';

    if (existingQueue?.id) {
      await db
        .update(chatbotQueue)
        .set({
          threadId,
          userId: isUserIdUuid ? user_id : null,
          status: 'pending',
          intent: null,
          confidence: null,
          userQuery: message,
          lastBotResponse: null,
          handoffReason,
          updatedAt: now,
        })
        .where(eq(chatbotQueue.id, existingQueue.id));
    } else {
      await db
        .insert(chatbotQueue)
        .values({
          threadId,
          conversationId,
          userId: isUserIdUuid ? user_id : null,
          status: 'pending',
          intent: null,
          confidence: null,
          userQuery: message,
          lastBotResponse: null,
          handoffReason,
          promptInjectionSuspected: false,
          updatedAt: now,
        });
    }

    return NextResponse.json({
      accepted: true,
      mode: 'human',
      notice: withinSupportHours ? null : getOutsideHoursNoticeRo(),
      conversation_id: conversationId,
    });

  } catch (error) {
    console.error('Web chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
