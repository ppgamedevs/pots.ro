/**
 * Server-Sent Events (SSE) endpoint for Support Threads
 * Streams real-time notifications when new messages arrive
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { supportEventEmitter, type SupportEventData } from '@/lib/support/event-emitter';

// Ensure Node.js runtime for long-lived connections (SSE requires Node.js, not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[SSE] Received GET request:', { 
      url: request.url,
      method: request.method,
      timestamp: Date.now()
    });
    
    // Authenticate user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[SSE] Error during authentication:', authError);
      return new Response('Authentication error', { status: 500 });
    }
    
    if (!user) {
      console.warn('[SSE] Authentication failed - no user found');
      return new Response('Authentication required', { status: 401 });
    }
    
    if (!user.role || !['admin', 'support'].includes(user.role)) {
      console.warn('[SSE] Authorization failed - insufficient role:', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });
      return new Response('Forbidden', { status: 403 });
    }

    console.log('[SSE] New connection request:', { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      currentSubscribers: supportEventEmitter.getSubscriberCount(),
      timestamp: Date.now()
    });

    // Create a ReadableStream for SSE
    // The start callback executes synchronously when the stream is created
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

        // Subscribe to events IMMEDIATELY (synchronously)
        // This must happen before any async operations
        unsubscribe = supportEventEmitter.subscribe((eventData: SupportEventData) => {
          const subscriberCount = supportEventEmitter.getSubscriberCount();
          console.log('[SSE] Broadcasting event to client:', { 
            userId: user.id, 
            eventData, 
            subscribers: subscriberCount 
          });
          send('data: ' + JSON.stringify({ type: 'new_message', ...eventData }) + '\n\n');
        });

        // Log immediately after subscription
        const subscriberCount = supportEventEmitter.getSubscriberCount();
        console.log('[SSE] Connection established and subscribed:', { 
          userId: user.id, 
          email: user.email, 
          subscribers: subscriberCount,
          timestamp: Date.now()
        });

        // Send initial connection confirmation
        send('data: ' + JSON.stringify({ type: 'connected', timestamp: Date.now() }) + '\n\n');

        // Send heartbeat every 30 seconds to keep connection alive
        heartbeatInterval = setInterval(() => {
          send(': heartbeat\n\n');
        }, 30_000);

        // Handle client disconnect
        const abortHandler = () => {
          const remainingSubscribers = supportEventEmitter.getSubscriberCount() - (unsubscribe ? 1 : 0);
          console.log('[SSE] Connection closed:', { 
            userId: user.id, 
            email: user.email, 
            remainingSubscribers,
            hadSubscription: unsubscribe !== null
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
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error) {
    console.error('[SSE] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
