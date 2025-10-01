// Checkout storage utilities for Week 4 MVP frontend
import { CheckoutAddress, ShippingRate } from '@/types/checkout';

const STORAGE_PREFIX = 'pots.checkout.';

export function getAddress(): CheckoutAddress | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}address`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAddress(address: CheckoutAddress): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}address`, JSON.stringify(address));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function getShipping(): ShippingRate | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}shipping`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setShipping(shipping: ShippingRate): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}shipping`, JSON.stringify(shipping));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function getOrderId(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}orderId`);
  } catch {
    return null;
  }
}

export function setOrderId(orderId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}orderId`, orderId);
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}address`);
    localStorage.removeItem(`${STORAGE_PREFIX}shipping`);
    localStorage.removeItem(`${STORAGE_PREFIX}orderId`);
  } catch {
    // Silently fail if localStorage is not available
  }
}
