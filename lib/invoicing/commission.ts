import { InvoiceProvider, InvoiceInput, InvoiceResult } from './index';
import { getInvoiceProvider } from './index';

/**
 * Emite doar factura de comision pentru o comandă
 * Aceasta este factura emisă de platformă pentru comisionul luat
 */
export async function createCommissionInvoice(
  orderId: string,
  commissionAmountCents: number,
  currency: string,
  buyer: {
    name: string;
    email?: string;
    address?: any;
  }
): Promise<InvoiceResult> {
  const invoiceProvider = getInvoiceProvider();
  
  const invoiceInput: InvoiceInput = {
    orderId,
    buyer,
    items: [
      {
        name: 'Comision platformă',
        qty: 1,
        unitPrice: commissionAmountCents / 100,
        vatRate: parseFloat(process.env.INVOICE_DEFAULT_VAT || '19'),
      }
    ],
    currency: currency as 'RON' | 'EUR',
    series: 'COM', // Serie pentru facturi de comision
  };

  return await invoiceProvider.createInvoice(invoiceInput);
}
