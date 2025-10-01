import { apiGet, apiPost } from './client';
import { OrderDetail, OrderFilters, Paged } from '../types';

export async function listOrders(params: {
  role: 'seller' | 'admin';
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  carrier?: string;
  page?: number;
}): Promise<Paged<OrderDetail>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const url = `/api/orders?${searchParams.toString()}`;
  return apiGet<Paged<OrderDetail>>(url);
}

export async function getOrder(id: string): Promise<OrderDetail> {
  return apiGet<OrderDetail>(`/api/orders/${id}`);
}

export async function packOrder(id: string): Promise<{ ok: boolean; order: { id: string; status: string } }> {
  return apiPost(`/api/orders/${id}/pack`);
}

export async function shipOrder(id: string, awbNumber: string): Promise<{ ok: boolean; order: { id: string; status: string; awbNumber: string } }> {
  return apiPost(`/api/orders/${id}/ship`, { awbNumber });
}

export async function deliverOrder(id: string): Promise<{ ok: boolean; order: { id: string; status: string; deliveredAt: string } }> {
  return apiPost(`/api/orders/${id}/deliver`);
}

export async function cancelOrder(id: string, reason: string): Promise<{ ok: boolean; order: { id: string; status: string; canceledReason: string } }> {
  return apiPost(`/api/orders/${id}/cancel`, { reason });
}
