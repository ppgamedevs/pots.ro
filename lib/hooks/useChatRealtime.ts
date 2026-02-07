/**
 * Real-time Chat Hook
 * Provides real-time communication using SSE with fallback to long polling
 * Handles message events, typing indicators, and presence updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type ChatEventType =
  | 'new_message'
  | 'message_delivered'
  | 'message_read'
  | 'typing_start'
  | 'typing_stop'
  | 'presence_update'
  | 'thread_status_change'
  | 'connected';

export interface ChatEvent {
  type: ChatEventType;
  threadId?: string;
  messageId?: string;
  userId?: string;
  userName?: string;
  status?: string;
  timestamp: number;
}

export type ChatEventHandler = (event: ChatEvent) => void;

export interface UseChatRealtimeOptions {
  threadId?: string;
  enabled?: boolean;
  onEvent?: ChatEventHandler;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseChatRealtimeReturn {
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  isConnected: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const LONG_POLL_TIMEOUT = 30000; // 30 seconds

export function useChatRealtime(options: UseChatRealtimeOptions = {}): UseChatRealtimeReturn {
  const { threadId, enabled = true, onEvent } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPollingRef = useRef(false);
  const longPollAbortControllerRef = useRef<AbortController | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep onEvent ref updated
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const handleEvent = useCallback((event: ChatEvent) => {
    if (onEventRef.current) {
      onEventRef.current(event);
    }
  }, []);

  const connectSSE = useCallback(() => {
    if (!enabled) return;

    // Cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (longPollAbortControllerRef.current) {
      longPollAbortControllerRef.current.abort();
      longPollAbortControllerRef.current = null;
    }

    isLongPollingRef.current = false;
    setConnectionStatus('connecting');

    try {
      const url = threadId
        ? `/api/chat/events?threadId=${encodeURIComponent(threadId)}`
        : '/api/chat/events';

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[ChatRealtime] SSE connection opened');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        isLongPollingRef.current = false;
      };

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'connected') {
            console.log('[ChatRealtime] SSE connected');
            setConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
          } else {
            handleEvent(data as ChatEvent);
          }
        } catch (error) {
          console.error('[ChatRealtime] Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[ChatRealtime] SSE error:', error);
        const readyState = eventSource.readyState;

        if (readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
          eventSource.close();
          eventSourceRef.current = null;

          // Fallback to long polling if SSE fails
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(
              BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1),
              30000
            );

            console.log(`[ChatRealtime] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              // Try SSE again first
              if (reconnectAttemptsRef.current <= 3) {
                connectSSE();
              } else {
                // After 3 failed attempts, fallback to long polling
                startLongPolling();
              }
            }, delay);
          } else {
            // Max attempts reached, fallback to long polling
            console.log('[ChatRealtime] Max reconnect attempts reached, falling back to long polling');
            startLongPolling();
          }
        }
      };
    } catch (error) {
      console.error('[ChatRealtime] Error creating SSE connection:', error);
      setConnectionStatus('error');
      startLongPolling();
    }
  }, [enabled, threadId, handleEvent]);

  const startLongPolling = useCallback(() => {
    if (!enabled || isLongPollingRef.current) return;

    console.log('[ChatRealtime] Starting long polling fallback');
    isLongPollingRef.current = true;
    setConnectionStatus('connecting');

    const poll = async () => {
      if (!enabled || !isLongPollingRef.current) return;

      const abortController = new AbortController();
      longPollAbortControllerRef.current = abortController;

      try {
        const url = threadId
          ? `/api/chat/events?threadId=${encodeURIComponent(threadId)}&poll=true`
          : '/api/chat/events?poll=true';

        const response = await fetch(url, {
          signal: abortController.signal,
          headers: {
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (abortController.signal.aborted) return;

        if (response.ok) {
          const data = await response.json();
          if (data.events && Array.isArray(data.events)) {
            data.events.forEach((event: ChatEvent) => {
              handleEvent(event);
            });
          }
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }

        // Continue polling
        if (isLongPollingRef.current && enabled) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // Aborted, stop polling
        }

        console.error('[ChatRealtime] Long polling error:', error);
        setConnectionStatus('error');

        // Retry after delay
        if (isLongPollingRef.current && enabled) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  }, [enabled, threadId, handleEvent]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectSSE();
  }, [connectSSE]);

  // Connect on mount or when options change
  useEffect(() => {
    if (enabled) {
      connectSSE();
    } else {
      // Cleanup when disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (longPollAbortControllerRef.current) {
        longPollAbortControllerRef.current.abort();
        longPollAbortControllerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isLongPollingRef.current = false;
      setConnectionStatus('disconnected');
    }

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (longPollAbortControllerRef.current) {
        longPollAbortControllerRef.current.abort();
        longPollAbortControllerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, connectSSE]);

  return {
    connectionStatus,
    reconnect,
    isConnected: connectionStatus === 'connected',
  };
}
