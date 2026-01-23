/**
 * Client API pentru ledger financiar Pots.ro
 * Funcții de fetch pentru rapoarte și sumare financiară
 */

import { FinanceSummary, LedgerEntry, LedgerFilters } from '@/lib/types.finante';
import { ApiResponse, Paged } from '@/lib/types';

export type { LedgerFilters } from '@/lib/types.finante';

const API_BASE = '/api';

// Helper pentru fetch cu error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Eroare de rețea',
    };
  }
}

// Obține sumarul financiar pentru o perioadă
export async function getFinanceSummary(range: {
  from: string;
  to: string;
}): Promise<ApiResponse<FinanceSummary>> {
  const params = new URLSearchParams();
  params.append('from', range.from);
  params.append('to', range.to);

  return apiFetch<FinanceSummary>(`${API_BASE}/admin/finance/summary?${params}`);
}

// Obține sumarul financiar pentru săptămâna curentă
export async function getWeeklyFinanceSummary(): Promise<ApiResponse<FinanceSummary>> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Duminică
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sâmbătă
  weekEnd.setHours(23, 59, 59, 999);

  return getFinanceSummary({
    from: weekStart.toISOString().split('T')[0],
    to: weekEnd.toISOString().split('T')[0],
  });
}

// Obține sumarul financiar pentru luna curentă
export async function getMonthlyFinanceSummary(): Promise<ApiResponse<FinanceSummary>> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return getFinanceSummary({
    from: monthStart.toISOString().split('T')[0],
    to: monthEnd.toISOString().split('T')[0],
  });
}

// Lista intrări ledger cu filtre
export async function listLedgerEntries(filters: LedgerFilters = {}): Promise<ApiResponse<Paged<LedgerEntry>>> {
  const params = new URLSearchParams();
  
  if (filters.type) params.append('type', filters.type);
  if (filters.entityType) params.append('entityType', filters.entityType);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

  return apiFetch<Paged<LedgerEntry>>(`${API_BASE}/admin/ledger?${params}`);
}

// Backwards-compatible alias for pages/components.
export const listLedger = listLedgerEntries;

// Obține soldul curent al platformei
export async function getPlatformBalance(): Promise<ApiResponse<{
  balance: number;
  currency: string;
  totalIn: number;
  totalOut: number;
  lastUpdated: string;
}>> {
  return apiFetch(`${API_BASE}/admin/finance/balance`);
}

// Obține trend-ul financiar pentru ultimele N zile
export async function getFinanceTrend(days: number = 30): Promise<ApiResponse<{
  trend: Array<{
    d: string; // Data (YYYY-MM-DD)
    v: number; // Valoare
  }>;
  summary: {
    totalIn: number;
    totalOut: number;
    net: number;
  };
}>> {
  return apiFetch(`${API_BASE}/admin/finance/trend?days=${days}`);
}

// Verifică integritatea ledger-ului
export async function verifyLedgerIntegrity(): Promise<ApiResponse<{
  valid: boolean;
  issues: string[];
  balance: {
    totalIn: number;
    totalOut: number;
    balance: number;
    currency: string;
  };
}>> {
  return apiFetch(`${API_BASE}/admin/finance/verify`);
}

// Export CSV pentru ledger
export async function exportLedgerCSV(filters: LedgerFilters = {}): Promise<Blob> {
  const params = new URLSearchParams();
  
  if (filters.type) params.append('type', filters.type);
  if (filters.entityType) params.append('entityType', filters.entityType);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);

  const response = await fetch(`${API_BASE}/admin/finance/export?${params}`);
  
  if (!response.ok) {
    throw new Error('Eroare la exportul CSV');
  }

  return response.blob();
}

// Helper pentru SWR keys
export const ledgerKeys = {
  all: ['ledger'] as const,
  summary: (range: { from: string; to: string }) => [...ledgerKeys.all, 'summary', range] as const,
  weekly: () => [...ledgerKeys.all, 'weekly'] as const,
  monthly: () => [...ledgerKeys.all, 'monthly'] as const,
  entries: (filters: LedgerFilters) => [...ledgerKeys.all, 'entries', filters] as const,
  balance: () => [...ledgerKeys.all, 'balance'] as const,
  trend: (days: number) => [...ledgerKeys.all, 'trend', days] as const,
  verify: () => [...ledgerKeys.all, 'verify'] as const,
};
