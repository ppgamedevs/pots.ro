/**
 * CSV Export pentru Pots.ro
 * Funcții pentru exportul datelor financiare în format CSV
 */

import { PayoutCSVRow, RefundCSVRow } from '@/lib/types.finante';
import { Payout, Refund } from '@/lib/types.finante';

// Helper pentru escaparea valorilor CSV
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Dacă conține virgulă, ghilimele sau newline, înconjoară cu ghilimele și escape ghilimelele
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

// Helper pentru formatarea datei
function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ro-RO');
}

// Helper pentru formatarea sumei
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

// Export payout-uri în CSV
export function exportPayoutsToCSV(payouts: Payout[]): string {
  const headers = [
    'Data',
    'Comandă',
    'Suma (RON)',
    'Comision (RON)',
    'Status',
    'Provider Ref',
    'Data Plății',
  ];

  const rows = payouts.map((payout): PayoutCSVRow => ({
    data: formatDate(payout.createdAt),
    comanda: payout.orderId,
    suma: payout.amount,
    comision: payout.commission,
    status: payout.status,
    providerRef: payout.providerRef || '',
    dataPlata: payout.paidAt ? formatDate(payout.paidAt) : '',
  }));

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => [
      escapeCSVValue(row.data),
      escapeCSVValue(row.comanda),
      escapeCSVValue(formatAmount(row.suma)),
      escapeCSVValue(formatAmount(row.comision)),
      escapeCSVValue(row.status),
      escapeCSVValue(row.providerRef),
      escapeCSVValue(row.dataPlata),
    ].join(',')),
  ].join('\n');

  return csvContent;
}

// Export refund-uri în CSV
export function exportRefundsToCSV(refunds: Refund[]): string {
  const headers = [
    'Data',
    'Comandă',
    'Suma (RON)',
    'Motiv',
    'Status',
    'Provider Ref',
  ];

  const rows = refunds.map((refund): RefundCSVRow => ({
    data: formatDate(refund.createdAt),
    comanda: refund.orderId,
    suma: refund.amount,
    motiv: refund.reason,
    status: refund.status,
    providerRef: refund.providerRef || '',
  }));

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => [
      escapeCSVValue(row.data),
      escapeCSVValue(row.comanda),
      escapeCSVValue(formatAmount(row.suma)),
      escapeCSVValue(row.motiv),
      escapeCSVValue(row.status),
      escapeCSVValue(row.providerRef),
    ].join(',')),
  ].join('\n');

  return csvContent;
}

// Export ledger în CSV
export function exportLedgerToCSV(entries: Array<{
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
  meta?: any;
}>): string {
  const headers = [
    'Data',
    'Tip',
    'Suma',
    'Monedă',
    'Entitate',
    'Detalii',
  ];

  const rows = entries.map(entry => [
    escapeCSVValue(formatDate(entry.createdAt)),
    escapeCSVValue(entry.type),
    escapeCSVValue(formatAmount(entry.amount)),
    escapeCSVValue(entry.currency),
    escapeCSVValue(entry.meta?.entityType || ''),
    escapeCSVValue(entry.meta ? JSON.stringify(entry.meta) : ''),
  ]);

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

// Helper pentru download-ul fișierului CSV
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Helper pentru generarea numelui de fișier cu data curentă
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${dateStr}.${extension}`;
}

// Export rapid pentru payout-uri (cu nume de fișier generat)
export function exportPayoutsCSV(payouts: Payout[]): void {
  const content = exportPayoutsToCSV(payouts);
  const filename = generateFilename('payouts');
  downloadCSV(content, filename);
}

// Export rapid pentru refund-uri (cu nume de fișier generat)
export function exportRefundsCSV(refunds: Refund[]): void {
  const content = exportRefundsToCSV(refunds);
  const filename = generateFilename('refunds');
  downloadCSV(content, filename);
}

// Export rapid pentru ledger (cu nume de fișier generat)
export function exportLedgerCSV(entries: Array<{
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
  meta?: any;
}>): void {
  const content = exportLedgerToCSV(entries);
  const filename = generateFilename('ledger');
  downloadCSV(content, filename);
}
