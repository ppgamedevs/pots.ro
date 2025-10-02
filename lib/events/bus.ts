// Event Bus pentru comunicarea frontend-ului Pots.ro

export type EventMap = {
  order_paid: { orderId: string };
  order_shipped: { orderId: string; awb?: string; carrier?: string };
  order_delivered: { orderId: string };
  message_created: { conversationId: string; orderId: string };
  invoice_created: { orderId: string; invoiceId: string };
  cart_updated: { itemCount: number };
  user_logged_in: { userId: string; role: string };
  user_logged_out: {};
  // Week 7: Evenimente financiare
  payout_ready: { orderId: string; payoutId: string; sellerId: string };
  payout_paid: { payoutId: string; providerRef: string };
  payout_failed: { payoutId: string; reason: string };
  return_requested: { orderId: string; reason: string };
  return_approved: { orderId: string; method: string };
  returned: { orderId: string };
  refund_created: { refundId: string; orderId: string; amount: number };
  refund_refunded: { refundId: string; providerRef: string };
  refund_failed: { refundId: string; reason: string };
};

export type Handler<T> = (payload: T) => void;

const listeners: Partial<{ [K in keyof EventMap]: Set<Handler<any>> }> = {};

/**
 * Înregistrează un listener pentru un tip de eveniment
 */
export function on<K extends keyof EventMap>(
  type: K, 
  callback: Handler<EventMap[K]>
): () => void {
  if (!listeners[type]) {
    listeners[type] = new Set();
  }
  
  listeners[type]!.add(callback);
  
  // Returnează funcția de cleanup
  return () => {
    listeners[type]?.delete(callback);
  };
}

/**
 * Emite un eveniment către toți listenerii
 */
export function emit<K extends keyof EventMap>(
  type: K, 
  payload: EventMap[K]
): void {
  listeners[type]?.forEach(callback => {
    try {
      callback(payload);
    } catch (error) {
      console.error(`Error in event handler for ${type}:`, error);
    }
  });
}

/**
 * Emite un eveniment cu delay (pentru debouncing)
 */
export function emitDelayed<K extends keyof EventMap>(
  type: K, 
  payload: EventMap[K],
  delay: number = 100
): void {
  setTimeout(() => emit(type, payload), delay);
}

/**
 * Hook React pentru folosirea event bus-ului
 */
export function useEventBus<K extends keyof EventMap>(
  type: K,
  callback: Handler<EventMap[K]>,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    const cleanup = on(type, callback);
    return cleanup;
  }, deps);
}

/**
 * Hook pentru emiterea evenimentelor din componente
 */
export function useEventEmitter() {
  return {
    emit,
    emitDelayed,
  };
}

/**
 * Utilitare pentru evenimente specifice
 */
export const OrderEvents = {
  paid: (orderId: string) => emit('order_paid', { orderId }),
  shipped: (orderId: string, awb?: string, carrier?: string) => 
    emit('order_shipped', { orderId, awb, carrier }),
  delivered: (orderId: string) => emit('order_delivered', { orderId }),
};

export const MessageEvents = {
  created: (conversationId: string, orderId: string) => 
    emit('message_created', { conversationId, orderId }),
};

export const InvoiceEvents = {
  created: (orderId: string, invoiceId: string) => 
    emit('invoice_created', { orderId, invoiceId }),
};

export const CartEvents = {
  updated: (itemCount: number) => emit('cart_updated', { itemCount }),
};

export const AuthEvents = {
  loggedIn: (userId: string, role: string) => 
    emit('user_logged_in', { userId, role }),
  loggedOut: () => emit('user_logged_out', {}),
};

// Week 7: Evenimente financiare
export const PayoutEvents = {
  ready: (orderId: string, payoutId: string, sellerId: string) => 
    emit('payout_ready', { orderId, payoutId, sellerId }),
  paid: (payoutId: string, providerRef: string) => 
    emit('payout_paid', { payoutId, providerRef }),
  failed: (payoutId: string, reason: string) => 
    emit('payout_failed', { payoutId, reason }),
};

export const ReturnEvents = {
  requested: (orderId: string, reason: string) => 
    emit('return_requested', { orderId, reason }),
  approved: (orderId: string, method: string) => 
    emit('return_approved', { orderId, method }),
  returned: (orderId: string) => 
    emit('returned', { orderId }),
};

export const RefundEvents = {
  created: (refundId: string, orderId: string, amount: number) => 
    emit('refund_created', { refundId, orderId, amount }),
  refunded: (refundId: string, providerRef: string) => 
    emit('refund_refunded', { refundId, providerRef }),
  failed: (refundId: string, reason: string) => 
    emit('refund_failed', { refundId, reason }),
};

/**
 * Debug helper pentru development
 */
export function debugEventBus() {
  if (process.env.NODE_ENV === 'development') {
    const originalEmit = emit;
    
    // Override emit pentru logging
    (window as any).emit = function<K extends keyof EventMap>(
      type: K, 
      payload: EventMap[K]
    ) {
      console.log(`[EventBus] ${type}:`, payload);
      originalEmit(type, payload);
    };
    
    console.log('[EventBus] Debug mode enabled. Use window.emit() to emit events.');
  }
}

// Import React pentru hook-uri
import React from 'react';
