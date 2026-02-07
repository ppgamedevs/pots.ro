/**
 * Event Emitter for Support Threads
 * Broadcasts events when new messages arrive to all connected SSE clients
 * Enhanced with typing indicators, presence, and message state updates
 */

export type SupportEventData = {
  threadId: string;
  status: string;
  timestamp: number;
};

export type ChatEventData = 
  | { type: 'new_message'; threadId: string; messageId: string; status: string; timestamp: number }
  | { type: 'message_delivered'; threadId: string; messageId: string; timestamp: number }
  | { type: 'message_read'; threadId: string; messageId: string; timestamp: number }
  | { type: 'typing_start'; threadId: string; userId: string; userName?: string; timestamp: number }
  | { type: 'typing_stop'; threadId: string; userId: string; timestamp: number }
  | { type: 'presence_update'; threadId: string; userId: string; status: 'online' | 'offline' | 'away'; timestamp: number }
  | { type: 'thread_status_change'; threadId: string; status: string; timestamp: number };

type EventCallback = (data: SupportEventData) => void;
type ChatEventCallback = (data: ChatEventData) => void;

class SupportEventEmitter {
  private listeners = new Set<EventCallback>();
  private chatListeners = new Set<ChatEventCallback>();

  /**
   * Subscribe to events
   * @param callback Function to call when events are emitted
   * @returns Unsubscribe function
   */
  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to chat events (messages, typing, presence)
   */
  subscribeChat(callback: ChatEventCallback): () => void {
    this.chatListeners.add(callback);
    return () => this.chatListeners.delete(callback);
  }

  /**
   * Emit an event to all subscribers
   * @param threadId The thread ID that was updated
   * @param status The new status of the thread
   */
  emit(threadId: string, status: string): void {
    const eventData: SupportEventData = {
      threadId,
      status,
      timestamp: Date.now(),
    };
    this.listeners.forEach((cb) => {
      try {
        cb(eventData);
      } catch (error) {
        console.error('[SupportEventEmitter] Error in event handler:', error);
      }
    });
  }

  /**
   * Emit a chat event (message, typing, presence)
   */
  emitChat(event: ChatEventData): void {
    this.chatListeners.forEach((cb) => {
      try {
        cb(event);
      } catch (error) {
        console.error('[SupportEventEmitter] Error in chat event handler:', error);
      }
    });
  }

  /**
   * Get the number of active subscribers
   */
  getSubscriberCount(): number {
    return this.listeners.size;
  }

  /**
   * Get the number of active chat subscribers
   */
  getChatSubscriberCount(): number {
    return this.chatListeners.size;
  }
}

export const supportEventEmitter = new SupportEventEmitter();
