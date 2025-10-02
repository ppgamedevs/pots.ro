import { InvoiceProvider, InvoiceInput, InvoiceResult } from './index';

export class FacturisProvider implements InvoiceProvider {
  private apiBase: string;
  private apiKey: string;
  private series: string;

  constructor() {
    this.apiBase = process.env.FACTURIS_API_BASE || 'https://api.facturis.ro';
    this.apiKey = process.env.FACTURIS_API_KEY || '';
    this.series = process.env.FACTURIS_SERIES || 'PO';

    if (!this.apiKey) {
      throw new Error('FACTURIS_API_KEY environment variable is required');
    }
  }

  async createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    try {
      // Facturis API call
      const response = await fetch(`${this.apiBase}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          client: {
            name: input.buyer.name,
            vatNumber: input.buyer.cui,
            email: input.buyer.email,
            address: input.buyer.address,
          },
          series: input.series || this.series,
          currency: input.currency,
          items: input.items.map(item => ({
            description: item.name,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Facturis API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        series: data.series,
        number: data.number,
        pdfUrl: data.pdfUrl,
        total: data.total,
        issuer: 'facturis',
      };
    } catch (error) {
      console.error('Facturis provider error:', error);
      throw new Error(`Facturis provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
