/**
 * Presence API
 * Handles user presence updates (online/offline/away)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { updatePresence, markActive } from '@/lib/chat/presence-service';
import { db } from '@/db';
import { supportThreads } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const threadId = typeof body?.threadId === 'string' ? body.threadId.trim() : null;
    const status = typeof body?.status === 'string' ? body.status : null; // 'online' | 'offline' | 'away'

    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    // Verify thread exists
    const [thread] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Update presence
    if (status && ['online', 'offline', 'away'].includes(status)) {
      updatePresence(user.id, threadId, status as 'online' | 'offline' | 'away');
    } else {
      // Default: mark as active (online)
      markActive(user.id, threadId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Presence API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
