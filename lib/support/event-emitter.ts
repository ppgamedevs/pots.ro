/**
 * Event Emitter for Support Threads
 * Broadcasts events when new messages arrive to all connected SSE clients
 */

export type SupportEventData = {
  threadId: string;
  status: string;
  timestamp: number;
};

type EventCallback = (data: SupportEventData) => void;

class SupportEventEmitter {
  private listeners = new Set<EventCallback>();

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
   * Get the number of active subscribers
   */
  getSubscriberCount(): number {
    return this.listeners.size;
  }
}

export const supportEventEmitter = new SupportEventEmitter();
