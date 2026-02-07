/**
 * Typing Indicator Service
 * Manages typing indicators with debouncing and cleanup
 */

import { db } from '@/db';
import { typingIndicators, supportThreads, users } from '@/db/schema/core';
import { eq, and, lt } from 'drizzle-orm';
import { supportEventEmitter } from '@/lib/support/event-emitter';
import { sql } from 'drizzle-orm';

const TYPING_TIMEOUT_MS = 3000; // 3 seconds of inactivity = stop typing
const TYPING_CLEANUP_INTERVAL_MS = 10 * 1000; // Cleanup every 10 seconds

// In-memory typing state for fast access
const typingState = new Map<string, { threadId: string; userId: string; timeoutId: NodeJS.Timeout }>();

/**
 * Start typing indicator
 */
export async function startTyping(threadId: string, userId: string, userName?: string): Promise<void> {
  const key = `${threadId}:${userId}`;
  const now = new Date();

  // Clear existing timeout
  const existing = typingState.get(key);
  if (existing) {
    clearTimeout(existing.timeoutId);
  }

  // Set timeout to auto-stop typing
  const timeoutId = setTimeout(() => {
    stopTyping(threadId, userId);
  }, TYPING_TIMEOUT_MS);

  typingState.set(key, { threadId, userId, timeoutId });

  // Update database
  await db
    .insert(typingIndicators)
    .values({
      threadId,
      userId,
      isTyping: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [typingIndicators.threadId, typingIndicators.userId],
      set: {
        isTyping: true,
        updatedAt: now,
      },
    });

  // Emit event
  supportEventEmitter.emitChat({
    type: 'typing_start',
    threadId,
    userId,
    userName,
    timestamp: Date.now(),
  });
}

/**
 * Stop typing indicator
 */
export async function stopTyping(threadId: string, userId: string): Promise<void> {
  const key = `${threadId}:${userId}`;
  const existing = typingState.get(key);

  if (existing) {
    clearTimeout(existing.timeoutId);
    typingState.delete(key);
  }

  // Update database
  await db
    .update(typingIndicators)
    .set({
      isTyping: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(typingIndicators.threadId, threadId),
        eq(typingIndicators.userId, userId)
      )
    );

  // Emit event
  supportEventEmitter.emitChat({
    type: 'typing_stop',
    threadId,
    userId,
    timestamp: Date.now(),
  });
}

/**
 * Get active typing users for a thread
 */
export async function getTypingUsers(threadId: string): Promise<Array<{ userId: string; userName?: string }>> {
  try {
    const activeTyping = await db
      .select({
        userId: typingIndicators.userId,
        userName: users.name,
        updatedAt: typingIndicators.updatedAt,
      })
      .from(typingIndicators)
      .leftJoin(users, eq(typingIndicators.userId, users.id))
      .where(
        and(
          eq(typingIndicators.threadId, threadId),
          eq(typingIndicators.isTyping, true),
          // Only show typing if updated within last 3 seconds
          sql`${typingIndicators.updatedAt} > NOW() - INTERVAL '3 seconds'`
        )
      );

    return activeTyping.map((t: { userId: string; userName: string | null; updatedAt: Date }) => ({
      userId: t.userId,
      userName: t.userName || undefined,
    }));
  } catch (error) {
    console.error('[TypingService] Error getting typing users:', error);
    return [];
  }
}

/**
 * Cleanup stale typing indicators
 */
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - TYPING_TIMEOUT_MS);
    await db
      .update(typingIndicators)
      .set({ isTyping: false })
      .where(lt(typingIndicators.updatedAt, cutoff));
  } catch (error) {
    console.error('[TypingService] Error cleaning up typing indicators:', error);
  }
}, TYPING_CLEANUP_INTERVAL_MS);
