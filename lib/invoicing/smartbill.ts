import { InvoiceProvider, InvoiceInput, InvoiceResult } from './index';

export class SmartBillProvider implements InvoiceProvider {
  private apiBase: string;
  private username: string;
  private token: string;
  private series: string;

  constructor() {
    this.apiBase = process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api';
    this.username = process.env.SMARTBILL_USERNAME || '';
    this.token = process.env.SMARTBILL_TOKEN || '';
    this.series = process.env.SMARTBILL_SERIES || 'PO';

    if (!this.username || !this.token) {
      throw new Error('SMARTBILL_USERNAME and SMARTBILL_TOKEN environment variables are required');
    }
  }

  async createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    try {
      // SmartBill API call
      const response = await fetch(`${this.apiBase}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`,
        },
        body: JSON.stringify({
          companyVatNumber: process.env.COMPANY_VAT_NUMBER || 'RO12345678',
          client: {
            name: input.buyer.name,
            vatNumber: input.buyer.cui,
            email: input.buyer.email,
            address: input.buyer.address,
          },
          seriesName: input.series || this.series,
          currency: input.currency,
          language: 'RO',
          products: input.items.map(item => ({
            name: item.name,
            quantity: item.qty,
            price: item.unitPrice,
            vatRate: item.vatRate,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`SmartBill API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        series: data.seriesName,
        number: data.number,
        pdfUrl: data.pdfUrl,
        total: data.total,
        issuer: 'smartbill',
      };
    } catch (error) {
      console.error('SmartBill provider error:', error);
      throw new Error(`SmartBill provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
