export type InvoiceInput = {
  orderId: string;
  buyer: { 
    name: string; 
    cui?: string; 
    email?: string; 
    address?: any 
  };
  items: Array<{ 
    name: string; 
    qty: number; 
    unitPrice: number; 
    vatRate: number 
  }>;
  currency: 'RON' | 'EUR';
  series?: string;
};

export type InvoiceResult = {
  series: string;
  number: string;
  pdfUrl: string;
  total: number;
  issuer: 'smartbill' | 'facturis' | 'mock';
};

export interface InvoiceProvider {
  createInvoice(input: InvoiceInput): Promise<InvoiceResult>;
}

export function getInvoiceProvider(): InvoiceProvider {
  const provider = process.env.INVOICE_PROVIDER || 'mock';
  
  switch (provider) {
    case 'smartbill':
      return new SmartBillProvider();
    case 'facturis':
      return new FacturisProvider();
    case 'mock':
    default:
      return new MockInvoiceProvider();
  }
}

// Import providers
import { SmartBillProvider } from './smartbill';
import { FacturisProvider } from './facturis';
import { MockInvoiceProvider } from './mock';
