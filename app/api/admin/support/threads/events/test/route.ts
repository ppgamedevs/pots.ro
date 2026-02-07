/**
 * Test endpoint for SSE events
 * Allows manual triggering of SSE events for testing purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { supportEventEmitter } from '@/lib/support/event-emitter';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!['admin', 'support'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const threadId = typeof body?.threadId === 'string' ? body.threadId.trim() : null;
    const status = typeof body?.status === 'string' ? body.status.trim() : 'waiting';

    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    // Emit test event
    supportEventEmitter.emit(threadId, status);

    const subscriberCount = supportEventEmitter.getSubscriberCount();

    console.log('[SSE Test] Event emitted:', { threadId, status, subscriberCount, triggeredBy: user.email });

    return NextResponse.json({
      success: true,
      message: 'Test event emitted',
      threadId,
      status,
      subscribers: subscriberCount,
    });
  } catch (error) {
    console.error('[SSE Test] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
