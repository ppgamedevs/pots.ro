export type OrderStatus = 'pending' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'canceled' | 'refunded' | 'return_requested' | 'return_approved' | 'returned';

/**
 * Valid order status transitions
 * Key: from status, Value: array of valid to statuses
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'canceled'],
  paid: ['packed', 'canceled'],
  packed: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: ['refunded', 'return_requested'], // Allow refunds and return requests after delivery
  canceled: [], // No transitions from canceled
  refunded: [], // No transitions from refunded
  return_requested: ['return_approved', 'returned'], // Can approve or mark as returned
  return_approved: ['returned'], // Can mark as returned after approval
  returned: [], // No transitions from returned
};

/**
 * Check if a status transition is valid
 * @param from Current status
 * @param to Target status
 * @returns true if transition is valid
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Validate a status transition and throw error if invalid
 * @param from Current status
 * @param to Target status
 * @throws Error with message "Invalid transition" if transition is not allowed
 */
export function validateTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid transition from ${from} to ${to}`);
  }
}

/**
 * Get all valid next statuses for a given current status
 * @param currentStatus Current order status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return [...VALID_TRANSITIONS[currentStatus]];
}

/**
 * Check if an order can be canceled
 * @param currentStatus Current order status
 * @returns true if order can be canceled
 */
export function canCancelOrder(currentStatus: OrderStatus): boolean {
  return ['pending', 'paid', 'packed'].includes(currentStatus);
}

/**
 * Check if an order can be refunded
 * @param currentStatus Current order status
 * @returns true if order can be refunded
 */
export function canRefundOrder(currentStatus: OrderStatus): boolean {
  return currentStatus === 'delivered';
}

/**
 * Check if an order is in a terminal state (no further transitions possible)
 * @param status Order status
 * @returns true if status is terminal
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ['delivered', 'canceled', 'refunded'].includes(status);
}

/**
 * Check if an order is in progress (can still be modified)
 * @param status Order status
 * @returns true if order is still in progress
 */
export function isInProgressStatus(status: OrderStatus): boolean {
  return ['pending', 'paid', 'packed', 'shipped'].includes(status);
}

/**
 * Get human-readable description of status transitions
 */
export function getTransitionDescription(from: OrderStatus, to: OrderStatus): string {
  const descriptions: Record<string, string> = {
    'pending->paid': 'Payment received',
    'paid->packed': 'Order packed',
    'packed->shipped': 'Order shipped',
    'shipped->delivered': 'Order delivered',
    'pending->canceled': 'Order canceled',
    'paid->canceled': 'Order canceled',
    'packed->canceled': 'Order canceled',
    'delivered->refunded': 'Order refunded',
  };
  
  return descriptions[`${from}->${to}`] || `Status changed from ${from} to ${to}`;
}
