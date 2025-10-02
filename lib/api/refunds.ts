/**
 * Client API pentru refund-uri Pots.ro
 * Funcții de fetch pentru operațiuni cu refund-uri
 */

import { Refund, RefundFilters, RefundCreateRequest } from '@/lib/types.finante';
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

// Lista refund-uri cu filtre
export async function listRefunds(filters: RefundFilters = {}): Promise<ApiResponse<Paged<Refund>>> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.orderId) params.append('orderId', filters.orderId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());

  return apiFetch<Paged<Refund>>(`${API_BASE}/admin/refunds?${params}`);
}

// Creează refund pentru o comandă
export async function createRefund(orderId: string, data: RefundCreateRequest): Promise<ApiResponse<Refund>> {
  return apiFetch<Refund>(`${API_BASE}/refunds/${orderId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Obține refund după ID
export async function getRefund(id: string): Promise<ApiResponse<Refund>> {
  return apiFetch<Refund>(`${API_BASE}/admin/refunds/${id}`);
}

// Retry refund eșuat
export async function retryRefund(id: string): Promise<ApiResponse<Refund>> {
  return apiFetch<Refund>(`${API_BASE}/admin/refunds/${id}/retry`, {
    method: 'POST',
  });
}

// Helper pentru SWR keys
export const refundKeys = {
  all: ['refunds'] as const,
  lists: () => [...refundKeys.all, 'list'] as const,
  list: (filters: RefundFilters) => [...refundKeys.lists(), filters] as const,
  details: () => [...refundKeys.all, 'detail'] as const,
  detail: (id: string) => [...refundKeys.details(), id] as const,
  order: (orderId: string) => [...refundKeys.all, 'order', orderId] as const,
};
