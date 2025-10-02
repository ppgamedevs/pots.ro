import { InvoiceProvider, InvoiceInput, InvoiceResult } from './index';

export class MockInvoiceProvider implements InvoiceProvider {
  async createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    // Generate deterministic mock invoice data
    const series = input.series || 'PO';
    const number = `${Date.now().toString().slice(-6)}`;
    const total = input.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    
    // Mock PDF URL pointing to our proxy route
    const pdfUrl = `/api/invoices/mock-${input.orderId}/pdf`;

    return {
      series,
      number,
      pdfUrl,
      total,
      issuer: 'mock',
    };
  }
}
