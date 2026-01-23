/**
 * Client API for admin communication tooling.
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

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Eroare de rețea',
    };
  }
}

export type BroadcastKind = 'system' | 'announcement' | 'marketing';
export type BroadcastStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'rejected'
  | 'failed';

export type BroadcastRow = {
  id: string;
  kind: BroadcastKind;
  channel: 'email';
  status: BroadcastStatus;
  name: string;
  subject: string;
  html?: string;
  text?: string | null;
  fromEmail?: string | null;
  segment?: any;
  scheduledAt?: string | null;
  approvedAt?: string | null;
  sendStartedAt?: string | null;
  sendCompletedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string | null;
};

export async function listBroadcasts(filters?: { status?: string }): Promise<ApiResponse<{ rows: BroadcastRow[] }>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return apiFetch(`${API_BASE}/admin/communication/broadcasts${qs ? `?${qs}` : ''}`);
}

export async function createBroadcast(input: {
  kind?: BroadcastKind;
  name: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  segment?: any;
}): Promise<ApiResponse<{ ok: boolean; id: string }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getBroadcast(id: string): Promise<ApiResponse<{ row: BroadcastRow }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}`);
}

export async function updateBroadcast(id: string, input: Partial<Pick<BroadcastRow, 'name' | 'subject' | 'html' | 'text' | 'fromEmail' | 'segment'>>): Promise<ApiResponse<{ ok: boolean; id: string }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function requestBroadcastApproval(id: string): Promise<ApiResponse<{ ok: boolean; id: string; status: BroadcastStatus }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}/request-approval`, { method: 'POST' });
}

export async function approveBroadcast(id: string): Promise<ApiResponse<{ ok: boolean; id: string; status: BroadcastStatus }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}/approve`, { method: 'POST' });
}

export async function rejectBroadcast(id: string, input?: { reason?: string }): Promise<ApiResponse<{ ok: boolean; id: string; status: BroadcastStatus }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: (input?.reason || 'Rejected by admin').trim() }),
  });
}

export async function scheduleBroadcast(id: string, input?: { scheduledAt?: string }): Promise<ApiResponse<{ ok: boolean; id: string; status: BroadcastStatus; scheduledAt: string }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

export async function cancelBroadcast(id: string): Promise<ApiResponse<{ ok: boolean; id: string; status: BroadcastStatus }>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/${id}/cancel`, { method: 'POST' });
}

export async function previewSegment(input: {
  roles: Array<'buyer' | 'seller'>;
  requireEmailNotifications?: boolean;
  requirePromotionsOptIn?: boolean;
  requireNewsletterOptIn?: boolean;
}): Promise<ApiResponse<any>> {
  return apiFetch(`${API_BASE}/admin/communication/broadcasts/preview`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type DeliverabilityDashboard = {
  windowDays: number;
  since: string;
  counts: Record<string, number>;
  rates: { attempted: number; bounceRate: number; complaintRate: number };
  daily: Array<{ day: string; eventType: string; count: number }>;
  suppressions: { active: number; total: number };
};

export async function getDeliverability(windowDays?: number): Promise<ApiResponse<DeliverabilityDashboard>> {
  const params = new URLSearchParams();
  if (windowDays) params.set('windowDays', String(windowDays));
  const qs = params.toString();
  return apiFetch(`${API_BASE}/admin/communication/deliverability${qs ? `?${qs}` : ''}`);
}

export type SuppressionRow = {
  email: string;
  reason: 'bounce' | 'complaint' | 'manual' | 'unsubscribe';
  source: 'resend' | 'admin' | 'user';
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  updatedAt: string;
};

export async function listSuppressions(filters?: { q?: string; active?: boolean }): Promise<ApiResponse<{ rows: SuppressionRow[] }>> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.active) params.set('active', '1');
  const qs = params.toString();
  return apiFetch(`${API_BASE}/admin/communication/suppressions${qs ? `?${qs}` : ''}`);
}

export async function addSuppression(input: { email: string; reason: SuppressionRow['reason']; note?: string }): Promise<ApiResponse<{ ok: boolean; email: string }>> {
  return apiFetch(`${API_BASE}/admin/communication/suppressions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function revokeSuppression(input: { email: string; note?: string }): Promise<ApiResponse<{ ok: boolean; email: string }>> {
  return apiFetch(`${API_BASE}/admin/communication/suppressions`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
