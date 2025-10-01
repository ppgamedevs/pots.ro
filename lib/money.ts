export function formatCents(cents: number, currency: string = 'RON'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCents(amount: string): number {
  const parsed = parseFloat(amount.replace(/[^\d.-]/g, ''));
  return Math.round(parsed * 100);
}

export function assertSameCurrency(currency1: string, currency2: string): void {
  if (currency1 !== currency2) {
    throw new Error(`Currency mismatch: ${currency1} vs ${currency2}`);
  }
}

export function normalizeCurrency(currency?: string): string {
  return currency || 'RON';
}

export function isValidCurrency(currency: string): boolean {
  return ['RON', 'EUR', 'USD'].includes(currency);
}

// Additional money utilities for Week 4
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function roundCents(cents: number): number {
  return Math.round(cents);
}

export function calculateCommission(subtotalCents: number, commissionPct: number): number {
  // commissionPct is in basis points (e.g., 1000 = 10%)
  return Math.round((subtotalCents * commissionPct) / 10000);
}

export function calculateSellerDue(subtotalCents: number, commissionAmountCents: number): number {
  return subtotalCents - commissionAmountCents;
}
