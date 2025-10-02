/**
 * Tipuri financiare pentru UI Pots.ro
 * Mapări simple la nume de câmpuri și normalizări pentru frontend
 */

import { PayoutRow, RefundRow, LedgerRow } from '@/lib/drizzle/types';

// Statusuri normalizate pentru UI
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'REFUNDED' | 'FAILED';
export type ReturnStatus = 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURNED';

// Tipuri UI pentru payout-uri
export type Payout = {
  id: string;
  sellerId: string;
  orderId: string;
  amount: number;
  commission: number;
  currency: 'RON' | 'EUR';
  status: PayoutStatus;
  providerRef?: string;
  paidAt?: string;
  failureReason?: string;
  createdAt: string;
};

// Tipuri UI pentru refund-uri
export type Refund = {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  providerRef?: string;
  failureReason?: string;
  createdAt: string;
};

// Tipuri UI pentru ledger
export type LedgerEntry = {
  id: string;
  type: 'CHARGE' | 'COMMISSION' | 'PAYOUT' | 'REFUND' | 'RECOVERY';
  entityId: string;
  entityType: 'order' | 'payout' | 'refund' | 'seller' | 'platform';
  amount: number;
  currency: string;
  createdAt: string;
  meta?: any;
};

// Tipuri pentru retururi
export type ReturnRequest = {
  orderId?: string;
  reason: string;
  method: 'exchange' | 'refund';
  items?: Array<{
    itemId: string;
    qty: number;
    reason: string;
  }>;
  requestedAt?: string;
};

export type ReturnApproval = {
  orderId?: string;
  method: 'exchange' | 'refund';
  notes?: string;
  approvedAt?: string;
  approvedBy?: string;
  solution?: 'approved' | 'rejected';
  adminOverride?: boolean;
};

// Tipuri pentru filtre UI
export type PayoutFilters = {
  status?: PayoutStatus;
  sellerId?: string;
  from?: string;
  to?: string;
  page?: number;
};

export type RefundFilters = {
  status?: RefundStatus;
  orderId?: string;
  from?: string;
  to?: string;
  page?: number;
};

export type LedgerFilters = {
  type?: 'CHARGE' | 'COMMISSION' | 'PAYOUT' | 'REFUND' | 'RECOVERY';
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PayoutRunRequest = {
  payoutId: string;
};

export type PayoutRunBatchRequest = {
  date: string; // YYYY-MM-DD format
};

export type RefundCreateRequest = {
  orderId: string;
  amount: number;
  reason: string;
  items?: Array<{
    itemId: string;
    qty: number;
    amount: number;
  }>;
};

export type ReturnFilters = {
  status?: ReturnStatus;
  orderId?: string;
  from?: string;
  to?: string;
  page?: number;
};

// Tipuri pentru rapoarte financiare
export type FinanceSummary = {
  incasari: number;
  comisioane: number;
  datorateSelleri: number;
  refunds: number;
  trend: Array<{
    d: string;
    v: number;
  }>;
};

export type PayoutSummary = {
  total: number;
  pending: number;
  processing: number;
  paid: number;
  failed: number;
};

export type RefundSummary = {
  total: number;
  pending: number;
  processing: number;
  refunded: number;
  failed: number;
};

// Tipuri pentru CSV export
export type PayoutCSVRow = {
  data: string;
  comanda: string;
  suma: number;
  comision: number;
  status: string;
  providerRef?: string;
  dataPlata?: string;
};

export type RefundCSVRow = {
  data: string;
  comanda: string;
  suma: number;
  motiv: string;
  status: string;
  providerRef?: string;
};

// Helper functions pentru mapare
export function mapPayoutRowToUI(row: PayoutRow): Payout {
  return {
    id: row.id,
    sellerId: row.sellerId,
    orderId: row.orderId,
    amount: parseFloat(row.amount),
    commission: parseFloat(row.commissionAmount),
    currency: row.currency as 'RON' | 'EUR',
    status: row.status.toUpperCase() as PayoutStatus,
    providerRef: row.providerRef || undefined,
    paidAt: row.paidAt?.toISOString(),
    failureReason: row.failureReason || undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapRefundRowToUI(row: RefundRow): Refund {
  return {
    id: row.id,
    orderId: row.orderId,
    amount: parseFloat(row.amount),
    reason: row.reason,
    status: row.status.toUpperCase() as RefundStatus,
    providerRef: row.providerRef || undefined,
    failureReason: row.failureReason || undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapLedgerRowToUI(row: LedgerRow): LedgerEntry {
  return {
    id: row.id,
    type: row.type.toUpperCase() as LedgerEntry['type'],
    entityId: row.entityId,
    entityType: row.entityType,
    amount: parseFloat(row.amount),
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    meta: row.meta,
  };
}

// Helper functions pentru status
export function getPayoutStatusLabel(status: PayoutStatus): string {
  const labels: Record<PayoutStatus, string> = {
    PENDING: 'În așteptare',
    PROCESSING: 'În procesare',
    PAID: 'Plătit',
    FAILED: 'Eșuat',
  };
  return labels[status];
}

export function getRefundStatusLabel(status: RefundStatus): string {
  const labels: Record<RefundStatus, string> = {
    PENDING: 'În așteptare',
    PROCESSING: 'În procesare',
    REFUNDED: 'Rambursat',
    FAILED: 'Eșuat',
  };
  return labels[status];
}

export function getReturnStatusLabel(status: ReturnStatus): string {
  const labels: Record<ReturnStatus, string> = {
    RETURN_REQUESTED: 'Solicitat',
    RETURN_APPROVED: 'Aprobat',
    RETURNED: 'Returnat',
  };
  return labels[status];
}

// Helper functions pentru culori status
export function getPayoutStatusColor(status: PayoutStatus): string {
  const colors: Record<PayoutStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getRefundStatusColor(status: RefundStatus): string {
  const colors: Record<RefundStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    REFUNDED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getReturnStatusColor(status: ReturnStatus): string {
  const colors: Record<ReturnStatus, string> = {
    RETURN_REQUESTED: 'bg-orange-100 text-orange-800',
    RETURN_APPROVED: 'bg-cyan-100 text-cyan-800',
    RETURNED: 'bg-slate-100 text-slate-800',
  };
  return colors[status];
}
