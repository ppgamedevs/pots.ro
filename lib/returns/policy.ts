/**
 * Politica de retururi pentru Pots.ro
 * Reguli pentru cererile de retur și anulări
 */

export interface ReturnPolicy {
  maxDaysAfterDelivery: number;
  allowedStatuses: string[];
  requiredReasons: string[];
  refundMethods: Array<'exchange' | 'refund'>;
}

export interface ReturnRequest {
  orderId: string;
  reason: string;
  items: Array<{
    itemId: string;
    qty: number;
    reason: string;
  }>;
  requestedAt: Date;
}

export interface ReturnValidation {
  valid: boolean;
  reason?: string;
  policyViolations: string[];
}

// Politica de retururi (14 zile după livrare)
export const RETURN_POLICY: ReturnPolicy = {
  maxDaysAfterDelivery: 14,
  allowedStatuses: ['delivered'],
  requiredReasons: [
    'produs_defect',
    'produs_gresit',
    'descriere_incorecta',
    'calitate_neasteptata',
    'altul'
  ],
  refundMethods: ['exchange', 'refund']
};

/**
 * Validează o cerere de retur
 */
export function validateReturnRequest(
  order: { status: string; deliveredAt: Date | null },
  request: ReturnRequest
): ReturnValidation {
  const violations: string[] = [];

  // Verifică status-ul comenzii
  if (!RETURN_POLICY.allowedStatuses.includes(order.status)) {
    violations.push(`Comanda trebuie să fie în status ${RETURN_POLICY.allowedStatuses.join(' sau ')}`);
  }

  // Verifică data livrării
  if (!order.deliveredAt) {
    violations.push('Comanda nu a fost livrată');
  } else {
    const daysSinceDelivery = Math.floor(
      (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceDelivery > RETURN_POLICY.maxDaysAfterDelivery) {
      violations.push(
        `Cererea de retur trebuie făcută în maximum ${RETURN_POLICY.maxDaysAfterDelivery} zile după livrare (${daysSinceDelivery} zile trecute)`
      );
    }
  }

  // Verifică motivul
  if (!RETURN_POLICY.requiredReasons.includes(request.reason)) {
    violations.push(`Motivul trebuie să fie unul din: ${RETURN_POLICY.requiredReasons.join(', ')}`);
  }

  // Verifică item-urile
  if (!request.items || request.items.length === 0) {
    violations.push('Trebuie specificat cel puțin un item pentru retur');
  }

  for (const item of request.items) {
    if (!item.itemId) {
      violations.push('Toate item-urile trebuie să aibă itemId');
    }
    if (!item.qty || item.qty <= 0) {
      violations.push('Toate item-urile trebuie să aibă cantitate pozitivă');
    }
    if (!item.reason) {
      violations.push('Toate item-urile trebuie să aibă motiv specificat');
    }
  }

  return {
    valid: violations.length === 0,
    reason: violations.length > 0 ? violations.join('; ') : undefined,
    policyViolations: violations
  };
}

/**
 * Validează o cerere de anulare
 */
export function validateCancellationRequest(
  order: { status: string; createdAt: Date }
): ReturnValidation {
  const violations: string[] = [];

  // Verifică status-ul comenzii
  const allowedStatuses = ['pending', 'paid'];
  if (!allowedStatuses.includes(order.status)) {
    violations.push(`Comanda poate fi anulată doar în status ${allowedStatuses.join(' sau ')}`);
  }

  // Verifică dacă comanda nu a fost expediată
  if (order.status === 'shipped' || order.status === 'delivered') {
    violations.push('Comanda nu poate fi anulată după expediere');
  }

  return {
    valid: violations.length === 0,
    reason: violations.length > 0 ? violations.join('; ') : undefined,
    policyViolations: violations
  };
}

/**
 * Calculează suma de refund pentru o cerere de retur
 */
export function calculateRefundAmount(
  items: Array<{
    itemId: string;
    qty: number;
    unitPriceCents: number;
    subtotalCents: number;
  }>,
  returnItems: Array<{ itemId: string; qty: number }>
): {
  refundAmountCents: number;
  refundItems: Array<{
    itemId: string;
    qty: number;
    amountCents: number;
  }>;
} {
  const refundItems: Array<{ itemId: string; qty: number; amountCents: number }> = [];
  let totalRefundCents = 0;

  for (const returnItem of returnItems) {
    const originalItem = items.find(item => item.itemId === returnItem.itemId);
    
    if (originalItem) {
      const refundQty = Math.min(returnItem.qty, originalItem.qty);
      const refundAmountCents = Math.floor(
        (originalItem.unitPriceCents * refundQty)
      );
      
      refundItems.push({
        itemId: returnItem.itemId,
        qty: refundQty,
        amountCents: refundAmountCents
      });
      
      totalRefundCents += refundAmountCents;
    }
  }

  return {
    refundAmountCents: totalRefundCents,
    refundItems
  };
}

/**
 * Obține motivul de retur în format uman
 */
export function getReturnReasonText(reason: string): string {
  const reasons: Record<string, string> = {
    'produs_defect': 'Produs defect',
    'produs_gresit': 'Produs greșit',
    'descriere_incorecta': 'Descriere incorectă',
    'calitate_neasteptata': 'Calitate neașteptată',
    'altul': 'Alt motiv'
  };

  return reasons[reason] || reason;
}

/**
 * Verifică dacă o comandă poate fi anulată
 */
export function canCancelOrder(order: { status: string; createdAt: Date }): boolean {
  const validation = validateCancellationRequest(order);
  return validation.valid;
}

/**
 * Verifică dacă o comandă poate avea cerere de retur
 */
export function canRequestReturn(order: { status: string; deliveredAt: Date | null }): boolean {
  const validation = validateReturnRequest(order, {
    orderId: '',
    reason: 'produs_defect',
    items: [{ itemId: 'test', qty: 1, reason: 'test' }],
    requestedAt: new Date()
  });
  
  return validation.valid;
}
