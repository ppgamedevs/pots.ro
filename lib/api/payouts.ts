/**
 * Client API pentru payout-uri Pots.ro
 * Funcții de fetch pentru operațiuni cu payout-uri
 */

import { Payout, PayoutFilters, PayoutRunRequest, PayoutRunBatchRequest } from '@/lib/types.finante';
import { ApiResponse, Paged } from '@/lib/types';

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

// Seller API - Lista payout-uri pentru vânzător
export async function listSellerPayouts(filters: PayoutFilters = {}): Promise<ApiResponse<Paged<Payout>>> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());

  return apiFetch<Paged<Payout>>(`${API_BASE}/seller/payouts?${params}`);
}

// Seller API - Detalii payout
export async function getPayout(id: string): Promise<ApiResponse<Payout>> {
  return apiFetch<Payout>(`${API_BASE}/seller/payouts/${id}`);
}

// Admin API - Lista toate payout-urile
export async function listPayouts(filters: PayoutFilters = {}): Promise<ApiResponse<Paged<Payout>>> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.sellerId) params.append('sellerId', filters.sellerId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());

  const qs = params.toString();
  return apiFetch<Paged<Payout>>(`${API_BASE}/admin/payouts${qs ? `?${qs}` : ''}`);
}

// Admin API - Procesează payout individual
export async function runPayout(id: string): Promise<ApiResponse<Payout>> {
  return apiFetch<Payout>(`${API_BASE}/payouts/${id}/run`, {
    method: 'POST',
  });
}

// Admin API - Procesează batch payout-uri
export async function runPayoutBatch(request: PayoutRunBatchRequest): Promise<ApiResponse<{
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    payoutId: string;
    status: string;
    providerRef?: string;
    failureReason?: string;
  }>;
}>> {
  return apiFetch(`${API_BASE}/payouts/run-batch?date=${request.date}`, {
    method: 'POST',
  });
}

// Admin API - Retry payout eșuat
export async function retryPayout(id: string): Promise<ApiResponse<Payout>> {
  return apiFetch<Payout>(`${API_BASE}/payouts/${id}/run`, {
    method: 'POST',
  });
}

// Admin API - Marchează payout ca plătit manual
export async function markPayoutPaid(
  id: string,
  data: { providerRef?: string; reason: string }
): Promise<ApiResponse<Payout>> {
  return apiFetch<Payout>(`${API_BASE}/admin/payouts/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Admin API - First-person request approval
export async function requestPayoutApproval(id: string): Promise<ApiResponse<{ ok: boolean; payoutId: string }>> {
  return apiFetch(`${API_BASE}/admin/payouts/${id}/request-approval`, {
    method: 'POST',
  });
}

// Admin API - Second-person approve + run
export async function approveAndRunPayout(id: string): Promise<ApiResponse<any>> {
  return apiFetch(`${API_BASE}/admin/payouts/${id}/approve`, {
    method: 'POST',
  });
}

// Admin export - banking CSV
export function getPayoutsExportUrl(opts?: { status?: string; approvedOnly?: boolean; from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.approvedOnly != null) params.set('approvedOnly', String(opts.approvedOnly));
  if (opts?.from) params.set('from', opts.from);
  if (opts?.to) params.set('to', opts.to);
  const qs = params.toString();
  return `${API_BASE}/admin/payouts/export${qs ? `?${qs}` : ''}`;
}

// Helper pentru SWR keys
export const payoutKeys = {
  all: ['payouts'] as const,
  lists: () => [...payoutKeys.all, 'list'] as const,
  list: (filters: PayoutFilters) => [...payoutKeys.lists(), filters] as const,
  details: () => [...payoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...payoutKeys.details(), id] as const,
  seller: (filters: PayoutFilters) => [...payoutKeys.all, 'seller', filters] as const,
  admin: (filters: PayoutFilters) => [...payoutKeys.all, 'admin', filters] as const,
};
