/**
 * Presence Service
 * Tracks agent and customer online/offline/away status
 */

import { db } from '@/db';
import { supportThreads, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { supportEventEmitter } from '@/lib/support/event-emitter';

export type PresenceStatus = 'online' | 'offline' | 'away';

// In-memory presence tracking (can be moved to Redis for scalability)
const presenceMap = new Map<string, { status: PresenceStatus; lastSeen: number; threadIds: Set<string> }>();

const AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PRESENCE_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Update user presence for a thread
 */
export function updatePresence(
  userId: string,
  threadId: string,
  status: PresenceStatus
): void {
  const now = Date.now();
  const current = presenceMap.get(userId);

  if (current) {
    current.status = status;
    current.lastSeen = now;
    current.threadIds.add(threadId);
  } else {
    presenceMap.set(userId, {
      status,
      lastSeen: now,
      threadIds: new Set([threadId]),
    });
  }

  // Emit presence update for all threads user is part of
  const userPresence = presenceMap.get(userId);
  if (userPresence) {
    userPresence.threadIds.forEach((tid) => {
      supportEventEmitter.emitChat({
        type: 'presence_update',
        threadId: tid,
        userId,
        status,
        timestamp: now,
      });
    });
  }
}

/**
 * Remove user presence (on disconnect)
 */
export function removePresence(userId: string, threadId: string): void {
  const current = presenceMap.get(userId);
  if (current) {
    current.threadIds.delete(threadId);
    if (current.threadIds.size === 0) {
      presenceMap.delete(userId);
    } else {
      // Update status to offline for remaining threads
      updatePresence(userId, Array.from(current.threadIds)[0], 'offline');
    }
  }
}

/**
 * Get user presence status
 */
export function getPresence(userId: string): PresenceStatus | null {
  const current = presenceMap.get(userId);
  if (!current) return null;

  // Check if user should be marked as away
  const timeSinceLastSeen = Date.now() - current.lastSeen;
  if (timeSinceLastSeen > AWAY_TIMEOUT_MS && current.status === 'online') {
    current.status = 'away';
    return 'away';
  }

  return current.status;
}

/**
 * Mark user as active (reset away timer)
 */
export function markActive(userId: string, threadId: string): void {
  const current = presenceMap.get(userId);
  if (current && current.status === 'away') {
    updatePresence(userId, threadId, 'online');
  } else if (current) {
    current.lastSeen = Date.now();
  } else {
    updatePresence(userId, threadId, 'online');
  }
}

/**
 * Cleanup stale presence entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, presence] of presenceMap.entries()) {
    const timeSinceLastSeen = now - presence.lastSeen;
    if (timeSinceLastSeen > AWAY_TIMEOUT_MS * 2) {
      // User inactive for 10+ minutes, mark as offline
      if (presence.status !== 'offline') {
        presence.status = 'offline';
        presence.threadIds.forEach((threadId) => {
          supportEventEmitter.emitChat({
            type: 'presence_update',
            threadId,
            userId,
            status: 'offline',
            timestamp: now,
          });
        });
      }
    }
  }
}, PRESENCE_CLEANUP_INTERVAL_MS);
