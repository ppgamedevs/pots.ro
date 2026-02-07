/**
 * Typing Indicator API
 * Handles typing start/stop events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { startTyping, stopTyping } from '@/lib/chat/typing-service';
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
    const action = typeof body?.action === 'string' ? body.action : null; // 'start' | 'stop'

    if (!threadId || !action) {
      return NextResponse.json({ error: 'threadId and action are required' }, { status: 400 });
    }

    if (action !== 'start' && action !== 'stop') {
      return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
    }

    // Verify thread exists and user has access
    const [thread] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Update typing indicator
    if (action === 'start') {
      await startTyping(threadId, user.id, user.name || undefined);
    } else {
      await stopTyping(threadId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Typing API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
