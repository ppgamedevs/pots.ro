// API client helpers for Week 4 MVP frontend
import { CheckoutAddress, ShippingRate, OrderCreatePayload, OrderPublic, NetopiaInitResponse } from '@/types/checkout';

// Generic fetch wrappers
async function postJSON<T>(url: string, body: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

async function getJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Specific API functions
export async function getShippingRates(address: CheckoutAddress): Promise<ShippingRate[]> {
  const response = await postJSON<{ rates: ShippingRate[] }>('/api/shipping/rates', {
    city: address.city,
    postal_code: address.zip,
    weight_kg: 1, // Default weight for MVP
  });
  return response.rates;
}

export async function createOrder(payload: OrderCreatePayload): Promise<{
  order_id: string;
  totals: {
    subtotal_cents: number;
    shipping_fee_cents: number;
    total_cents: number;
    currency: string;
  };
}> {
  return postJSON('/api/checkout/create-order', payload);
}

export async function getOrderPublic(id: string): Promise<OrderPublic> {
  return getJSON(`/api/orders/${id}`);
}

export async function initNetopia(orderId: string): Promise<NetopiaInitResponse> {
  return postJSON('/api/payments/netopia/init', { order_id: orderId });
}

// Legacy API functions for existing pages
export async function apiGetProductById(id: number | string): Promise<any> {
  return getJSON(`/api/products/${id}`);
}

export async function apiGetCategories(): Promise<any[]> {
  return getJSON('/api/categories');
}

export async function apiGetCategoryProducts(categorySlug: string): Promise<{ items: any[] }> {
  return getJSON(`/api/categories/${categorySlug}/products`);
}

export async function apiGetSeller(slug: string): Promise<any> {
  return getJSON(`/api/sellers/${slug}`);
}