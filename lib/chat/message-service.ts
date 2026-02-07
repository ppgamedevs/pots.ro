/**
 * Message Service Layer
 * Handles message state management, delivery tracking, and read receipts
 */

import { db } from '@/db';
import { supportThreadMessages, messageDeliveryStatus, supportThreads } from '@/db/schema/core';
import { eq, and, ne, or, isNull } from 'drizzle-orm';
import { supportEventEmitter } from '@/lib/support/event-emitter';

export type MessageState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageDeliveryInfo {
  messageId: string;
  recipientId: string;
  state: MessageState;
  deliveredAt?: Date;
  readAt?: Date;
}

/**
 * Mark message as delivered
 */
export async function markMessageDelivered(messageId: string, recipientId: string): Promise<void> {
  try {
    const now = new Date();
    
    // Update or insert delivery status
    await db
      .insert(messageDeliveryStatus)
      .values({
        messageId,
        recipientId,
        status: 'delivered',
        statusAt: now,
      })
      .onConflictDoUpdate({
        target: [messageDeliveryStatus.messageId, messageDeliveryStatus.recipientId],
        set: {
          status: 'delivered',
          statusAt: now,
        },
      });

    // Update message deliveredAt if not already set
    await db
      .update(supportThreadMessages)
      .set({ deliveredAt: now })
      .where(eq(supportThreadMessages.id, messageId));

    // Emit event for real-time updates
    const [message] = await db
      .select({ threadId: supportThreadMessages.threadId })
      .from(supportThreadMessages)
      .where(eq(supportThreadMessages.id, messageId))
      .limit(1);

    if (message) {
      supportEventEmitter.emitChat({
        type: 'message_delivered',
        threadId: message.threadId,
        messageId,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('[MessageService] Error marking message as delivered:', error);
    throw error;
  }
}

/**
 * Mark message as read
 */
export async function markMessageRead(messageId: string, recipientId: string): Promise<void> {
  try {
    const now = new Date();
    
    // Update or insert delivery status
    await db
      .insert(messageDeliveryStatus)
      .values({
        messageId,
        recipientId,
        status: 'read',
        statusAt: now,
      })
      .onConflictDoUpdate({
        target: [messageDeliveryStatus.messageId, messageDeliveryStatus.recipientId],
        set: {
          status: 'read',
          statusAt: now,
        },
      });

    // Update message readAt if not already set
    await db
      .update(supportThreadMessages)
      .set({ readAt: now })
      .where(eq(supportThreadMessages.id, messageId));

    // Emit event for real-time updates
    const [message] = await db
      .select({ threadId: supportThreadMessages.threadId })
      .from(supportThreadMessages)
      .where(eq(supportThreadMessages.id, messageId))
      .limit(1);

    if (message) {
      supportEventEmitter.emitChat({
        type: 'message_read',
        threadId: message.threadId,
        messageId,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('[MessageService] Error marking message as read:', error);
    throw error;
  }
}

/**
 * Get message delivery status for a recipient
 */
export async function getMessageDeliveryStatus(
  messageId: string,
  recipientId: string
): Promise<MessageState | null> {
  try {
    const [status] = await db
      .select({ status: messageDeliveryStatus.status })
      .from(messageDeliveryStatus)
      .where(
        and(
          eq(messageDeliveryStatus.messageId, messageId),
          eq(messageDeliveryStatus.recipientId, recipientId)
        )
      )
      .limit(1);

    if (!status) return null;

    return status.status as MessageState;
  } catch (error) {
    console.error('[MessageService] Error getting delivery status:', error);
    return null;
  }
}

/**
 * Get all unread messages for a user in a thread
 */
export async function getUnreadMessages(threadId: string, userId: string): Promise<string[]> {
  try {
    const messages = await db
      .select({ id: supportThreadMessages.id })
      .from(supportThreadMessages)
      .leftJoin(
        messageDeliveryStatus,
        and(
          eq(messageDeliveryStatus.messageId, supportThreadMessages.id),
          eq(messageDeliveryStatus.recipientId, userId)
        )
      )
      .where(
        and(
          eq(supportThreadMessages.threadId, threadId),
          // Message is not from the user themselves
          ne(supportThreadMessages.authorId, userId),
          // Message doesn't have read status (NULL or not 'read')
          or(
            isNull(messageDeliveryStatus.status),
            ne(messageDeliveryStatus.status, 'read')
          )
        )
      );

    return messages.map((m: { id: string }) => m.id);
  } catch (error) {
    console.error('[MessageService] Error getting unread messages:', error);
    return [];
  }
}
