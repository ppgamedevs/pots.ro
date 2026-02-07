/**
 * Read Receipt API
 * Marks a message as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { markMessageRead } from '@/lib/chat/message-service';
import { db } from '@/db';
import { supportThreadMessages, supportThreads } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ messageId: string }>;
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { messageId } = await context.params;

    // Verify message exists and user has access to the thread
    const [message] = await db
      .select({
        id: supportThreadMessages.id,
        threadId: supportThreadMessages.threadId,
        authorId: supportThreadMessages.authorId,
      })
      .from(supportThreadMessages)
      .innerJoin(supportThreads, eq(supportThreadMessages.threadId, supportThreads.id))
      .where(eq(supportThreadMessages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Don't mark own messages as read
    if (message.authorId === user.id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Mark as read
    await markMessageRead(messageId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Read Receipt API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
