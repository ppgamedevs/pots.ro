/**
 * Client API pentru retururi Pots.ro
 * Funcții de fetch pentru operațiuni cu retururi
 */

import { ReturnRequest, ReturnApproval, ReturnFilters } from '@/lib/types.finante';
import { ApiResponse } from '@/lib/drizzle/types';

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

// Buyer API - Solicită retur pentru o comandă
export async function requestReturn(orderId: string, data: ReturnRequest): Promise<ApiResponse<{
  orderId: string;
  status: string;
  message: string;
}>> {
  return apiFetch(`${API_BASE}/orders/${orderId}/request-return`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Seller/Admin API - Aprobă cererea de retur
export async function approveReturn(orderId: string, data: ReturnApproval): Promise<ApiResponse<{
  orderId: string;
  status: string;
  method: string;
  message: string;
}>> {
  return apiFetch(`${API_BASE}/orders/${orderId}/approve-return`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Obține detaliile returului pentru o comandă
export async function getReturn(orderId: string): Promise<ApiResponse<{
  orderId: string;
  status: string;
  reason?: string;
  method?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}>> {
  return apiFetch(`${API_BASE}/orders/${orderId}/return`);
}

// Lista retururi cu filtre (Admin)
export async function listReturns(filters: ReturnFilters = {}): Promise<ApiResponse<{
  items: Array<{
    orderId: string;
    status: string;
    reason: string;
    method?: string;
    requestedAt: string;
    approvedAt?: string;
    approvedBy?: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.orderId) params.append('orderId', filters.orderId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());

  return apiFetch(`${API_BASE}/admin/returns?${params}`);
}

// Validează dacă o comandă poate avea cerere de retur
export async function validateReturnRequest(orderId: string): Promise<ApiResponse<{
  canReturn: boolean;
  reason?: string;
  daysSinceDelivery?: number;
  maxDays: number;
}>> {
  return apiFetch(`${API_BASE}/orders/${orderId}/return/validate`);
}

// Helper pentru SWR keys
export const returnKeys = {
  all: ['returns'] as const,
  lists: () => [...returnKeys.all, 'list'] as const,
  list: (filters: ReturnFilters) => [...returnKeys.lists(), filters] as const,
  details: () => [...returnKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...returnKeys.details(), orderId] as const,
  validate: (orderId: string) => [...returnKeys.all, 'validate', orderId] as const,
};
