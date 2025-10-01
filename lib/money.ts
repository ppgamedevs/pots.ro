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
