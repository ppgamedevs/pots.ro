/**
 * Enhanced SSE endpoint for Chat Events
 * Streams real-time chat events: messages, typing indicators, presence updates
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { supportEventEmitter, type ChatEventData } from '@/lib/support/event-emitter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Chat SSE] Received GET request:', {
      url: request.url,
      method: request.method,
      timestamp: Date.now(),
    });

    // Authenticate user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[Chat SSE] Error during authentication:', authError);
      return new Response('Authentication error', { status: 500 });
    }

    if (!user) {
      console.warn('[Chat SSE] Authentication failed - no user found');
      return new Response('Authentication required', { status: 401 });
    }

    // Get threadId from query params (optional - if provided, filter events for that thread)
    const { searchParams } = new URL(request.url);
    const threadIdFilter = searchParams.get('threadId');

    console.log('[Chat SSE] New connection request:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      threadIdFilter,
      currentSubscribers: supportEventEmitter.getChatSubscriberCount(),
      timestamp: Date.now(),
    });

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let unsubscribe: (() => void) | null = null;
        let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

        // Send initial connection message
        const send = (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            // Connection closed, ignore
          }
        };

        // Subscribe to chat events IMMEDIATELY (synchronously)
        unsubscribe = supportEventEmitter.subscribeChat((eventData: ChatEventData) => {
          // Filter by threadId if provided
          if (threadIdFilter && eventData.threadId !== threadIdFilter) {
            return;
          }

          // Don't send events for the same user (they already know their own actions)
          if (
            (eventData.type === 'typing_start' || eventData.type === 'typing_stop') &&
            'userId' in eventData &&
            eventData.userId === user.id
          ) {
            return;
          }

          console.log('[Chat SSE] Broadcasting event to client:', {
            userId: user.id,
            eventData,
            subscribers: supportEventEmitter.getChatSubscriberCount(),
          });

          send('data: ' + JSON.stringify(eventData) + '\n\n');
        });

        // Log immediately after subscription
        const subscriberCount = supportEventEmitter.getChatSubscriberCount();
        console.log('[Chat SSE] Connection established and subscribed:', {
          userId: user.id,
          email: user.email,
          subscribers: subscriberCount,
          timestamp: Date.now(),
        });

        // Send initial connection confirmation
        send('data: ' + JSON.stringify({ type: 'connected', timestamp: Date.now() }) + '\n\n');

        // Send heartbeat every 30 seconds to keep connection alive
        heartbeatInterval = setInterval(() => {
          send(': heartbeat\n\n');
        }, 30_000);

        // Handle client disconnect
        const abortHandler = () => {
          const remainingSubscribers = supportEventEmitter.getChatSubscriberCount() - (unsubscribe ? 1 : 0);
          console.log('[Chat SSE] Connection closed:', {
            userId: user.id,
            email: user.email,
            remainingSubscribers,
            hadSubscription: unsubscribe !== null,
          });
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          try {
            controller.close();
          } catch (error) {
            // Connection already closed, ignore
          }
        };

        request.signal.addEventListener('abort', abortHandler);

        // Also handle stream cancellation
        return () => {
          abortHandler();
        };
      },
      cancel() {
        // Stream was cancelled, cleanup is handled in start's return function
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error) {
    console.error('[Chat SSE] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
