/**
 * Client API for commission rates (admin).
 */

import { ApiResponse } from '@/lib/types';

const API_BASE = '/api';

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

export type CommissionRateRow = {
  id: string;
  sellerId: string | null;
  pctBps: number;
  effectiveAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  note: string | null;
  createdAt: string;
};

export async function listCommissionRates(filters?: { sellerId?: string; status?: string }): Promise<ApiResponse<{ data: CommissionRateRow[] }>> {
  const params = new URLSearchParams();
  if (filters?.sellerId) params.set('sellerId', filters.sellerId);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return apiFetch(`${API_BASE}/admin/commissions${qs ? `?${qs}` : ''}`);
}

export async function createCommissionRate(input: {
  sellerId?: string | null;
  pctBps: number;
  effectiveAt: string;
  note?: string;
}): Promise<ApiResponse<{ ok: boolean; data: CommissionRateRow }>> {
  return apiFetch(`${API_BASE}/admin/commissions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function approveCommissionRate(id: string): Promise<ApiResponse<{ ok: boolean; data: CommissionRateRow }>> {
  return apiFetch(`${API_BASE}/admin/commissions/${id}/approve`, {
    method: 'POST',
  });
}
