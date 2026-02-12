import { InvoiceProvider, InvoiceInput, InvoiceResult } from './index';
// TEMPORAR: Comentat pentru build Vercel
// import { writeFile, appendFile } from 'fs/promises';
// import { join } from 'path';

export interface ReceiptInput extends InvoiceInput {
  seller?: {
    name?: string;
    legalName?: string;
    cui?: string;
    email?: string;
    phone?: string;
  };
  paymentMethod?: string;
  paymentRef?: string;
  orderNumber?: string;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class SmartBillProvider implements InvoiceProvider {
  private apiBase: string;
  private username: string;
  private token: string;
  private series: string;
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS_MS = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.apiBase = process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api';
    this.username = process.env.SMARTBILL_USERNAME || '';
    this.token = process.env.SMARTBILL_TOKEN || '';
    this.series = process.env.SMARTBILL_SERIES || 'PO';

    // TEMPORAR: Validare comentată pentru a permite build-ul Vercel
    // TODO: Re-activează validarea după ce contul de test SmartBill este configurat
    // Validate required credentials
    // if (!this.username || !this.token) {
    //   throw new Error('SMARTBILL_USERNAME și SMARTBILL_TOKEN sunt obligatorii. Obține-le din Contul meu → Integrări → API în contul SmartBill.');
    // }

    // Validate COMPANY_VAT_NUMBER if set
    // const companyVatNumber = process.env.COMPANY_VAT_NUMBER;
    // if (companyVatNumber) {
    //   const trimmed = companyVatNumber.trim();
    //   // Basic validation: should start with RO and have digits
    //   if (!/^RO\d{2,10}$/i.test(trimmed)) {
    //     console.warn(`[SmartBill] COMPANY_VAT_NUMBER format may be invalid: ${trimmed}. Formatul așteptat este RO + 2-10 cifre (ex: RO12345678).`);
    //   }
    // } else {
    //   console.warn('[SmartBill] COMPANY_VAT_NUMBER nu este setat. Va fi folosit valoarea default RO12345678. Asigură-te că este identic cu CUI-ul din contul SmartBill (Setări → Date Companie).');
    // }

    // Validate receipt series if set
    // const receiptSeries = process.env.SMARTBILL_RECEIPT_SERIES;
    // if (receiptSeries && receiptSeries.trim().length === 0) {
    //   console.warn('[SmartBill] SMARTBILL_RECEIPT_SERIES este gol. Va fi folosită seria default sau cea din input.');
    // }
  }

  async createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    try {
      // Format address as string if it's an object, or omit if empty/invalid
      const formattedAddress = this.formatAddressForSmartBill(input.buyer.address);
      
      // Prepare payload using same structure as createReceipt for consistency
      const companyVatNumber = process.env.COMPANY_VAT_NUMBER || 'RO12345678';
      const seriesName = input.series || this.series;
      
      const payload: any = {
        companyVatNumber: companyVatNumber.trim(),
        seriesName: seriesName.trim(),
        currency: input.currency,
        language: 'RO',
        client: {
          name: input.buyer.name,
          ...(input.buyer.email && { email: input.buyer.email }),
          ...(input.buyer.cui && input.buyer.cui.trim().length > 0 && { vatNumber: input.buyer.cui.trim() }),
          ...(formattedAddress && { address: formattedAddress }),
        },
        products: input.items.map(item => ({
          name: item.name,
          quantity: item.qty,
          price: item.unitPrice,
          vatRate: item.vatRate,
        })),
      };
      
      // Use cleanPayload for consistency with createReceipt
      const cleanedPayload = this.cleanPayload(payload);
      
      // Log payload for debugging with document type tag
      console.log('[SmartBill] Sending invoice request [DOCUMENT_TYPE: INVOICE]:', {
        endpoint: `${this.apiBase}/invoice`,
        method: 'POST',
        payload: JSON.stringify(cleanedPayload, null, 2),
        seriesName: cleanedPayload.seriesName,
        companyVatNumber: cleanedPayload.companyVatNumber,
        productsCount: cleanedPayload.products?.length,
        hasClientEmail: !!cleanedPayload.client?.email,
        hasClientVatNumber: !!cleanedPayload.client?.vatNumber,
        hasClientAddress: !!cleanedPayload.client?.address,
        payloadStructure: {
          topLevelKeys: Object.keys(cleanedPayload),
          clientKeys: cleanedPayload.client ? Object.keys(cleanedPayload.client) : [],
          productStructure: cleanedPayload.products?.[0] ? Object.keys(cleanedPayload.products[0]) : [],
        },
      });
      
      // SmartBill API call
      const response = await fetch(`${this.apiBase}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`,
        },
        body: JSON.stringify(cleanedPayload),
      });

      if (!response.ok) {
        let errorMessage = `SmartBill API error: ${response.status} ${response.statusText}`;
        let isHTML = false;
        
        try {
          const contentType = response.headers.get('content-type') || '';
          const errorText = await response.text();
          
          // Detect HTML error pages (Tomcat error pages)
          isHTML = !contentType.includes('application/json') && 
                   (errorText.trim().toLowerCase().startsWith('<!doctype') || 
                    errorText.trim().toLowerCase().startsWith('<html'));
          
          if (isHTML) {
            // Extract meaningful information from HTML error page
            const statusMatch = errorText.match(/HTTP Status (\d+)/);
            const messageMatch = errorText.match(/<b>message<\/b>\s*(.+?)<\/p>/i);
            const descriptionMatch = errorText.match(/<b>description<\/b>\s*(.+?)<\/p>/i);
            
            const status = statusMatch ? statusMatch[1] : response.status.toString();
            const message = messageMatch ? messageMatch[1].trim() : 'Internal Server Error';
            const description = descriptionMatch ? descriptionMatch[1].trim() : null;
            
            errorMessage = `SmartBill API error ${status}: ${message}`;
            if (description && description !== message) {
              errorMessage += ` - ${description}`;
            }
            
            // Log HTML error for debugging
            console.error('[SmartBill] HTML error response received:', {
              status,
              message,
              description,
              htmlPreview: errorText.substring(0, 500),
            });
            
            // Enhance error message for HTML 500 errors
            if (response.status === 500) {
              errorMessage = `Eroare internă SmartBill (500). Verifică configurațiile în contul SmartBill:
- Serie '${cleanedPayload.seriesName}' există și este activă (Setări → Serii Documente)
- CUI companie '${cleanedPayload.companyVatNumber}' se potrivește cu cel din cont (Setări → Date Companie)
- Produsele pot fi create prin API sau sunt predefinite în cont`;
            }
          } else {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.errors) {
                errorMessage = Array.isArray(errorData.errors) 
                  ? errorData.errors.join(', ')
                  : JSON.stringify(errorData.errors);
              } else {
                errorMessage = errorText || errorMessage;
              }
            } catch {
              // Not JSON, use text (but limit length if too long)
              if (errorText) {
                errorMessage = errorText.length > 500 
                  ? errorText.substring(0, 500) + '...'
                  : errorText;
              }
            }
          }
        } catch (parseError) {
          // Use default error message
        }
        
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        throw error;
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

  /**
   * Create receipt with retry logic and comprehensive error handling
   * NOTE: SmartBill.ro may not support receipts through /invoice endpoint.
   * If this fails, consider using mock provider or contacting SmartBill support.
   */
  async createReceipt(input: ReceiptInput): Promise<InvoiceResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.RETRY_DELAYS_MS[attempt - 1];
          console.log(`[SmartBill] Retrying receipt creation (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delay}ms delay`);
          await sleep(delay);
        }

        const result = await this._createReceiptAttempt(input);
        if (attempt > 0) {
          console.log(`[SmartBill] Receipt created successfully on retry attempt ${attempt + 1}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('400') || error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
          console.error(`[SmartBill] Client error, not retrying:`, error.message);
          throw error;
        }

        // Don't retry on timeout errors (they're likely network issues)
        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('TIMEOUT'))) {
          if (attempt < this.MAX_RETRIES - 1) {
            console.warn(`[SmartBill] Timeout error, will retry:`, error.message);
            continue;
          }
        }

        // Log retry attempt
        if (attempt < this.MAX_RETRIES - 1) {
          console.warn(`[SmartBill] Receipt creation failed (attempt ${attempt + 1}/${this.MAX_RETRIES}):`, error instanceof Error ? error.message : String(error));
        } else {
          console.error(`[SmartBill] Receipt creation failed after ${this.MAX_RETRIES} attempts:`, error instanceof Error ? error.message : String(error));
        }
      }
    }

    // All retries exhausted
    throw new Error(`SmartBill receipt creation failed after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Single attempt to create receipt via Smartbill API
   */
  /**
   * Write debug log to file (fallback if HTTP logging fails)
   * TEMPORAR: Comentat pentru a permite build-ul Vercel
   */
  private async writeDebugLog(data: any): Promise<void> {
    // TEMPORAR: Comentat pentru build Vercel
    // try {
    //   const logPath = join(process.cwd(), '.cursor', 'debug.log');
    //   const logLine = JSON.stringify(data) + '\n';
    //   await appendFile(logPath, logLine, 'utf8');
    // } catch (err) {
    //   // Ignore file write errors
    // }
  }

  /**
   * Remove undefined values from an object recursively
   * Note: null values are preserved (SmartBill may require fields to be present even if null)
   */
  private removeUndefined(obj: any): any {
    if (obj === undefined) {
      return undefined;
    }
    if (obj === null) {
      return null; // Preserve null values
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item)).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        const value = this.removeUndefined(obj[key]);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
    return obj;
  }

  /**
   * Format address for SmartBill API
   * SmartBill expects address as a string or simple object
   */
  private formatAddressForSmartBill(address: any): string | undefined {
    if (!address) return undefined;
    
    if (typeof address === 'string') {
      return address.trim() || undefined;
    }
    
    if (typeof address === 'object') {
      // Build address string from object components
      const parts: string[] = [];
      if (address.street || address.address) parts.push((address.street || address.address).trim());
      if (address.city) parts.push(address.city.trim());
      if (address.county) parts.push(`Jud. ${address.county.trim()}`);
      if (address.postalCode) parts.push(address.postalCode.trim());
      if (address.country && address.country !== 'România' && address.country !== 'Romania') {
        parts.push(address.country.trim());
      }
      return parts.length > 0 ? parts.join(', ') : undefined;
    }
    
    return undefined;
  }

  /**
   * Clean payload by removing undefined values and validating required fields
   * This ensures we only send the minimal required payload to SmartBill API
   */
  private cleanPayload(payload: any): any {
    console.log('[SmartBill] cleanPayload START', {
      payloadReceived: JSON.stringify(payload, null, 2),
      hasCompanyVatNumber: !!payload.companyVatNumber,
      companyVatNumber: payload.companyVatNumber,
      hasSeriesName: !!payload.seriesName,
      seriesName: payload.seriesName,
      hasClient: !!payload.client,
      clientName: payload.client?.name,
      hasProducts: !!payload.products,
      productsCount: payload.products?.length,
      currency: payload.currency,
      language: payload.language,
    });
    
    try {
      const cleaned: any = {};

      // Validate and add companyVatNumber (required)
      const companyVatNumber = payload.companyVatNumber;
    if (!companyVatNumber || typeof companyVatNumber !== 'string' || companyVatNumber.trim().length === 0) {
      throw new Error('COMPANY_VAT_NUMBER environment variable is required and must be a valid CUI (e.g., RO12345678). Verifică Setări → Date Companie în contul SmartBill.');
    }
    cleaned.companyVatNumber = companyVatNumber.trim();

    // Validate and add seriesName (required)
    const seriesName = payload.seriesName;
    if (!seriesName || typeof seriesName !== 'string' || seriesName.trim().length === 0) {
      throw new Error(`Serie chitanță este obligatorie. Verifică că seria '${seriesName || 'N/A'}' există în contul SmartBill (Setări → Serii Documente).`);
    }
    cleaned.seriesName = seriesName.trim();

    // Validate and add currency (required)
    if (!payload.currency || !['RON', 'EUR'].includes(payload.currency)) {
      throw new Error(`Monedă invalidă: ${payload.currency}. Trebuie să fie 'RON' sau 'EUR'.`);
    }
    cleaned.currency = payload.currency;

    // Add language (required, default 'RO')
    cleaned.language = payload.language || 'RO';

    // Validate and add receipt-specific fields (issueDate, paymentDate, isDraft)
    if (payload.issueDate !== undefined) {
      if (typeof payload.issueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate)) {
        throw new Error(`issueDate invalid: ${payload.issueDate}. Trebuie să fie în format YYYY-MM-DD.`);
      }
      cleaned.issueDate = payload.issueDate;
    }

    if (payload.paymentDate !== undefined) {
      if (typeof payload.paymentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.paymentDate)) {
        throw new Error(`paymentDate invalid: ${payload.paymentDate}. Trebuie să fie în format YYYY-MM-DD.`);
      }
      cleaned.paymentDate = payload.paymentDate;
    }

    if (payload.isDraft !== undefined) {
      if (typeof payload.isDraft !== 'boolean') {
        throw new Error(`isDraft invalid: ${payload.isDraft}. Trebuie să fie boolean.`);
      }
      cleaned.isDraft = payload.isDraft;
    }

    // Add optional receipt-specific fields
    if (payload.paymentMethod && typeof payload.paymentMethod === 'string' && payload.paymentMethod.trim().length > 0) {
      cleaned.paymentMethod = payload.paymentMethod.trim();
    }

    if (payload.paymentRef && typeof payload.paymentRef === 'string' && payload.paymentRef.trim().length > 0) {
      cleaned.paymentRef = payload.paymentRef.trim();
    }

    if (payload.observations && typeof payload.observations === 'string' && payload.observations.trim().length > 0) {
      cleaned.observations = payload.observations.trim();
    }

    // Clean client object (only include defined fields)
    if (payload.client) {
      const client: any = {};
      
      // Name is required
      if (!payload.client.name || typeof payload.client.name !== 'string' || payload.client.name.trim().length === 0) {
        throw new Error('Numele clientului este obligatoriu.');
      }
      client.name = payload.client.name.trim();

      // Email is optional, only include if valid
      if (payload.client.email && typeof payload.client.email === 'string' && payload.client.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(payload.client.email.trim())) {
          client.email = payload.client.email.trim();
        }
      }

      // vatNumber is optional, only include if present and not empty
      if (payload.client.vatNumber && typeof payload.client.vatNumber === 'string' && payload.client.vatNumber.trim().length > 0) {
        client.vatNumber = payload.client.vatNumber.trim();
      }

      // Address is optional, only include if formatted address exists
      if (payload.client.address && typeof payload.client.address === 'string' && payload.client.address.trim().length > 0) {
        client.address = payload.client.address.trim();
      }

      cleaned.client = client;
    } else {
      throw new Error('Datele clientului sunt obligatorii.');
    }

    // Validate and clean products array (at least one product required)
    if (!payload.products || !Array.isArray(payload.products) || payload.products.length === 0) {
      throw new Error('Cel puțin un produs este obligatoriu.');
    }

    cleaned.products = payload.products.map((product: any, index: number) => {
      if (!product.name || typeof product.name !== 'string' || product.name.trim().length === 0) {
        throw new Error(`Produs ${index + 1}: numele este obligatoriu.`);
      }
      if (typeof product.quantity !== 'number' || product.quantity <= 0) {
        throw new Error(`Produs ${index + 1}: cantitatea trebuie să fie un număr pozitiv.`);
      }
      if (typeof product.price !== 'number' || product.price < 0) {
        throw new Error(`Produs ${index + 1}: prețul trebuie să fie un număr nenegativ.`);
      }
      if (typeof product.vatRate !== 'number' || product.vatRate < 0 || product.vatRate > 100) {
        throw new Error(`Produs ${index + 1}: cota TVA trebuie să fie între 0 și 100.`);
      }

      return {
        name: product.name.trim(),
        quantity: product.quantity,
        price: product.price,
        vatRate: product.vatRate,
      };
    });

      console.log('[SmartBill] cleanPayload SUCCESS', {
        cleanedPayload: JSON.stringify(cleaned, null, 2),
        companyVatNumber: cleaned.companyVatNumber,
        seriesName: cleaned.seriesName,
        productsCount: cleaned.products?.length,
        hasClientEmail: !!cleaned.client?.email,
        hasClientVatNumber: !!cleaned.client?.vatNumber,
        hasClientAddress: !!cleaned.client?.address,
      });

      return cleaned;
    } catch (error) {
      console.error('[SmartBill] cleanPayload ERROR', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: JSON.stringify(payload, null, 2),
        payloadType: typeof payload,
        hasCompanyVatNumber: !!payload.companyVatNumber,
        hasSeriesName: !!payload.seriesName,
        hasClient: !!payload.client,
        productsCount: payload.products?.length,
      });
      throw error;
    }
  }

  private async _createReceiptAttempt(input: ReceiptInput): Promise<InvoiceResult> {
    console.log('[SmartBill] _createReceiptAttempt START', {
      orderId: input.orderId,
      buyerName: input.buyer.name,
      buyerEmail: input.buyer.email,
      buyerCui: input.buyer.cui,
      buyerAddress: input.buyer.address,
      itemsCount: input.items.length,
      items: input.items.map(item => ({
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
      })),
      currency: input.currency,
      series: input.series,
      seller: input.seller,
      paymentMethod: input.paymentMethod,
      paymentRef: input.paymentRef,
      orderNumber: input.orderNumber,
    });
    
    const receiptInput: ReceiptInput = input as ReceiptInput;
    
    // Format address as string if it's an object, or omit if empty/invalid
    const formattedAddress = this.formatAddressForSmartBill(input.buyer.address);
    console.log('[SmartBill] Address formatting result', {
      originalAddress: input.buyer.address,
      formattedAddress,
      addressType: typeof formattedAddress,
    });
    
    // Prepare Smartbill API payload - minimal structure
    // SmartBill.ro uses the same /invoice endpoint for receipts
    const companyVatNumber = process.env.COMPANY_VAT_NUMBER;
    if (!companyVatNumber || companyVatNumber.trim().length === 0) {
      throw new Error('COMPANY_VAT_NUMBER environment variable is required. Verifică Setări → Date Companie în contul SmartBill.');
    }

    // For receipts, never use this.series (which is for invoices) as fallback
    // Use 'CH' as default receipt series instead
    const seriesName = receiptInput.series || process.env.SMARTBILL_RECEIPT_SERIES || 'CH';
    console.log('[SmartBill] Series determination for receipt', {
      receiptInputSeries: receiptInput.series,
      envReceiptSeries: process.env.SMARTBILL_RECEIPT_SERIES,
      envInvoiceSeries: process.env.SMARTBILL_SERIES,
      thisSeries: this.series,
      finalSeries: seriesName,
    });
    
    if (!seriesName || seriesName.trim().length === 0) {
      throw new Error(`SMARTBILL_RECEIPT_SERIES sau seria din input este obligatorie. Verifică că seria '${seriesName}' există în contul SmartBill (Setări → Serii Documente).`);
    }

    // Prepare receipt-specific fields
    const issueDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const paymentDate = issueDate; // Same as issueDate for receipts
    
    const payload: any = {
      companyVatNumber: companyVatNumber.trim(),
      seriesName: seriesName.trim(),
      currency: input.currency,
      language: 'RO',
      issueDate: issueDate,
      paymentDate: paymentDate,
      isDraft: false,
      client: {
        name: input.buyer.name,
        ...(input.buyer.email && { email: input.buyer.email }),
        ...(input.buyer.cui && input.buyer.cui.trim().length > 0 && { vatNumber: input.buyer.cui.trim() }),
        ...(formattedAddress && { address: formattedAddress }),
      },
      products: input.items.map(item => ({
        name: item.name,
        quantity: item.qty,
        price: item.unitPrice,
        vatRate: item.vatRate,
      })),
      ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
      ...(input.paymentRef && { paymentRef: input.paymentRef }),
      ...(input.orderNumber && { observations: `Comandă: ${input.orderNumber}` }),
    };

    // Clean payload: remove undefined values and validate required fields
    const cleanedPayload = this.cleanPayload(payload);
    
    // #region agent log
    const log3 = {location:'smartbill.ts:252',message:'Final payload before send',data:{cleanedPayload:JSON.stringify(cleanedPayload),hasClient:!!cleanedPayload.client,hasAddress:!!cleanedPayload.client?.address,addressValue:cleanedPayload.client?.address,productsCount:cleanedPayload.products?.length},timestamp:Date.now(),runId:'debug4',hypothesisId:'H3'};
    fetch('http://127.0.0.1:7242/ingest/4d9ef734-4941-42c7-9197-e66e14aa4710',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(log3)}).catch(()=>{});
    this.writeDebugLog(log3).catch(()=>{});
    // #endregion

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      // Log payload for debugging with detailed information
      const requestUrl = `${this.apiBase}/invoice`;
      const requestBody = JSON.stringify(cleanedPayload);
      const authHeader = `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`;
      
      // Receipt-specific fields for comparison
      const receiptSpecificFields = ['issueDate', 'paymentDate', 'isDraft', 'paymentMethod', 'paymentRef', 'observations'];
      const invoiceFields = ['companyVatNumber', 'seriesName', 'currency', 'language', 'client', 'products'];
      const receiptFields = Object.keys(cleanedPayload);
      const receiptSpecificFieldsPresent = receiptSpecificFields.filter(f => cleanedPayload[f] !== undefined);
      const missingFromInvoice = receiptSpecificFieldsPresent;

      console.log('[SmartBill] Request details [DOCUMENT_TYPE: RECEIPT]:', {
        url: requestUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ***',
        },
        bodyLength: requestBody.length,
        payloadPreview: requestBody.substring(0, 1000),
        fullPayload: JSON.stringify(cleanedPayload, null, 2),
        seriesName: cleanedPayload.seriesName,
        companyVatNumber: cleanedPayload.companyVatNumber,
        productsCount: cleanedPayload.products?.length,
        hasClientEmail: !!cleanedPayload.client?.email,
        hasClientVatNumber: !!cleanedPayload.client?.vatNumber,
        hasClientAddress: !!cleanedPayload.client?.address,
        currency: cleanedPayload.currency,
        language: cleanedPayload.language,
        username: this.username,
        hasToken: !!this.token,
        payloadStructure: {
          topLevelKeys: receiptFields,
          clientKeys: cleanedPayload.client ? Object.keys(cleanedPayload.client) : [],
          productStructure: cleanedPayload.products?.[0] ? Object.keys(cleanedPayload.products[0]) : [],
        },
        receiptPayloadComparison: {
          receiptFields: receiptFields,
          invoiceFields: invoiceFields,
          receiptSpecificFields: receiptSpecificFieldsPresent,
          missingFromInvoice: missingFromInvoice,
          receiptOnlyFields: receiptFields.filter(f => !invoiceFields.includes(f)),
        },
        comparisonNote: 'Compare payload structure with [DOCUMENT_TYPE: INVOICE] logs to identify differences',
      });
      
      // SmartBill.ro uses /invoice endpoint for both invoices and receipts
      // The difference is made by using a different series (e.g., 'CH' for chitanță vs 'PO' for invoice)
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: requestBody,
        signal: controller.signal,
      });
      
      console.log('[SmartBill] Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        contentType: response.headers.get('content-type'),
        url: response.url,
      });
      
      // #region agent log
      const log4 = {location:'smartbill.ts:285',message:'SmartBill response received',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),runId:'debug4',hypothesisId:'H3'};
      fetch('http://127.0.0.1:7242/ingest/4d9ef734-4941-42c7-9197-e66e14aa4710',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(log4)}).catch(()=>{});
      this.writeDebugLog(log4).catch(()=>{});
      // #endregion

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[SmartBill] Response not OK', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
        });
        
        let errorMessage = `SmartBill API error: ${response.status} ${response.statusText}`;
        let errorDetails: any = null;
        let isHTML = false;
        
        try {
          const contentType = response.headers.get('content-type') || '';
          const errorText = await response.text();
          
          console.log('[SmartBill] Error response body', {
            contentType,
            bodyLength: errorText.length,
            bodyPreview: errorText.substring(0, 500),
            fullBody: errorText, // Include full body for debugging
            startsWithHTML: errorText.trim().toLowerCase().startsWith('<!doctype') || errorText.trim().toLowerCase().startsWith('<html'),
          });
          
          // TEMPORAR: Comentat pentru build Vercel - salvare erori în fișiere
          // Save full error response to file for detailed analysis
          try {
            // TEMPORAR: Comentat pentru a permite build-ul Vercel
            // const errorLogPath = join(process.cwd(), '.cursor', `smartbill-error-${Date.now()}.log`);
            const receiptFields = Object.keys(cleanedPayload);
            const receiptSpecificFields = ['issueDate', 'paymentDate', 'isDraft', 'paymentMethod', 'paymentRef', 'observations'];
            const invoiceFields = ['companyVatNumber', 'seriesName', 'currency', 'language', 'client', 'products'];
            
            // TEMPORAR: Comentat writeFile pentru build Vercel
            // await writeFile(errorLogPath, JSON.stringify({
              timestamp: new Date().toISOString(),
              documentType: 'RECEIPT',
              request: {
                url: requestUrl,
                method: 'POST',
                payload: cleanedPayload,
                payloadComparison: {
                  receiptFields: receiptFields,
                  invoiceFields: invoiceFields,
                  receiptSpecificFields: receiptSpecificFields.filter(f => cleanedPayload[f] !== undefined),
                  receiptOnlyFields: receiptFields.filter(f => !invoiceFields.includes(f)),
                },
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic ***',
                },
              },
              response: {
                status: response.status,
                statusText: response.statusText,
                contentType,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText,
              },
              troubleshooting: {
                note: 'Compare this receipt payload with a successful invoice payload to identify missing or incorrect fields',
                receiptSeries: cleanedPayload.seriesName,
                companyVatNumber: cleanedPayload.companyVatNumber,
                hasIssueDate: !!cleanedPayload.issueDate,
                hasPaymentDate: !!cleanedPayload.paymentDate,
                hasIsDraft: cleanedPayload.isDraft !== undefined,
                hasPaymentMethod: !!cleanedPayload.paymentMethod,
                hasPaymentRef: !!cleanedPayload.paymentRef,
                hasObservations: !!cleanedPayload.observations,
              },
            }, null, 2), 'utf8');
            // console.log(`[SmartBill] Full error details saved to: ${errorLogPath}`);
          } catch (fileError) {
            // Ignore file write errors
          }
          
          // Detect HTML error pages (Tomcat error pages)
          isHTML = !contentType.includes('application/json') && 
                   (errorText.trim().toLowerCase().startsWith('<!doctype') || 
                    errorText.trim().toLowerCase().startsWith('<html'));
          
          if (isHTML) {
            // Extract meaningful information from HTML error page
            // Don't include full HTML in error message
            const statusMatch = errorText.match(/HTTP Status (\d+)/);
            const messageMatch = errorText.match(/<b>message<\/b>\s*(.+?)<\/p>/i);
            const descriptionMatch = errorText.match(/<b>description<\/b>\s*(.+?)<\/p>/i);
            
            const status = statusMatch ? statusMatch[1] : response.status.toString();
            const message = messageMatch ? messageMatch[1].trim() : 'Internal Server Error';
            const description = descriptionMatch ? descriptionMatch[1].trim() : null;
            
            errorMessage = `SmartBill API error ${status}: ${message}`;
            if (description && description !== message) {
              errorMessage += ` - ${description}`;
            }
            
            // Store HTML preview for logging, not full HTML
            errorDetails = `HTML error page (${status})`;
            
            // Log full HTML only in debug mode, not in error message
            console.error('[SmartBill] HTML error response received:', {
              status,
              message,
              description,
              htmlPreview: errorText.substring(0, 500),
            });
          } else {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.errors) {
                errorMessage = Array.isArray(errorData.errors) 
                  ? errorData.errors.join(', ')
                  : JSON.stringify(errorData.errors);
              } else {
                errorMessage = errorText || errorMessage;
              }
              errorDetails = errorText;
            } catch {
              // Not JSON, use text (but limit length if too long)
              if (errorText) {
                errorMessage = errorText.length > 500 
                  ? errorText.substring(0, 500) + '...'
                  : errorText;
                errorDetails = errorText;
              }
            }
          }
        } catch (parseError) {
          console.error('[SmartBill] Error parsing response', {
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            stack: parseError instanceof Error ? parseError.stack : undefined,
          });
          // Use default error message
        }

        // Enhance error messages with specific guidance based on status code and error content
        const lowerError = errorMessage.toLowerCase();
        const seriesName = cleanedPayload.seriesName;
        const companyVatNumber = cleanedPayload.companyVatNumber;
        
        // Log complete payload for comparison with working invoice payload
        const receiptFieldsForError = Object.keys(cleanedPayload);
        const receiptSpecificFieldsForError = ['issueDate', 'paymentDate', 'isDraft', 'paymentMethod', 'paymentRef', 'observations'];
        const invoiceFieldsForError = ['companyVatNumber', 'seriesName', 'currency', 'language', 'client', 'products'];
        
        console.error('[SmartBill] Error details - Full payload for comparison', {
          errorMessage,
          isHTML,
          errorDetails: errorDetails?.substring ? errorDetails.substring(0, 500) : errorDetails,
          fullPayloadJSON: JSON.stringify(cleanedPayload, null, 2),
          payloadComparison: {
            receiptFields: receiptFieldsForError,
            invoiceFields: invoiceFieldsForError,
            receiptSpecificFields: receiptSpecificFieldsForError.filter(f => cleanedPayload[f] !== undefined),
            receiptOnlyFields: receiptFieldsForError.filter(f => !invoiceFieldsForError.includes(f)),
          },
          payloadStructure: {
            topLevelKeys: receiptFieldsForError,
            clientKeys: cleanedPayload.client ? Object.keys(cleanedPayload.client) : [],
            productStructure: cleanedPayload.products?.[0] ? Object.keys(cleanedPayload.products[0]) : [],
          },
          status: response.status,
          fullPayloadJSON: JSON.stringify(cleanedPayload, null, 2),
          payloadStructure: {
            hasCompanyVatNumber: !!cleanedPayload.companyVatNumber,
            companyVatNumber: cleanedPayload.companyVatNumber,
            hasSeriesName: !!cleanedPayload.seriesName,
            seriesName: cleanedPayload.seriesName,
            currency: cleanedPayload.currency,
            language: cleanedPayload.language,
            hasClient: !!cleanedPayload.client,
            clientFields: cleanedPayload.client ? Object.keys(cleanedPayload.client) : [],
            client: {
              name: cleanedPayload.client?.name,
              email: cleanedPayload.client?.email,
              vatNumber: cleanedPayload.client?.vatNumber,
              address: cleanedPayload.client?.address,
            },
            hasProducts: !!cleanedPayload.products,
            productsCount: cleanedPayload.products?.length,
            products: cleanedPayload.products?.map((p: any) => ({
              name: p.name,
              quantity: p.quantity,
              price: p.price,
              vatRate: p.vatRate,
            })),
          },
          comparisonNote: 'Compare this payload structure with a working invoice payload to identify differences',
        });

        if (response.status === 400 || response.status === 422) {
          // Bad request - likely validation error
          if (lowerError.includes('serie') || lowerError.includes('series')) {
            errorMessage = `Serie '${seriesName}' nu există sau nu este activă în contul SmartBill. Mergi la Setări → Serii Documente și verifică că seria există și este activă.`;
          } else if (lowerError.includes('cui') || lowerError.includes('vat') || lowerError.includes('cif')) {
            errorMessage = `CUI companie '${companyVatNumber}' nu se potrivește cu cel din contul SmartBill. Verifică Setări → Date Companie și asigură-te că CUI-ul este identic cu COMPANY_VAT_NUMBER din environment variables.`;
          } else if (lowerError.includes('produs') || lowerError.includes('product')) {
            errorMessage = `Eroare la crearea produsului. Verifică că produsele pot fi create prin API sau că sunt predefinite în contul SmartBill.`;
          } else {
            errorMessage = `Eroare de validare SmartBill: ${errorMessage}. Verifică că toate configurațiile sunt corecte în contul SmartBill.`;
          }
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = `Eroare de autentificare SmartBill. Verifică că SMARTBILL_USERNAME și SMARTBILL_TOKEN sunt corecte (Contul meu → Integrări → API).`;
        } else if (response.status === 404) {
          errorMessage = `Endpoint SmartBill nu a fost găsit. Verifică că SMARTBILL_API_BASE este corect (default: https://ws.smartbill.ro/SBORO/api).`;
        } else if (response.status === 500) {
          // Internal server error - could be configuration issue
          if (isHTML) {
            // HTML error pages usually indicate configuration problems
            errorMessage = `Eroare internă SmartBill (500). Verifică configurațiile în contul SmartBill:
- Serie '${seriesName}' există și este activă (Setări → Serii Documente)
- CUI companie '${companyVatNumber}' se potrivește cu cel din cont (Setări → Date Companie)
- Produsele pot fi create prin API sau sunt predefinite în cont`;
          } else if (lowerError.includes('serie') || lowerError.includes('series')) {
            errorMessage = `Eroare internă SmartBill: Serie '${seriesName}' poate să nu existe sau să nu fie activă. Verifică Setări → Serii Documente în contul SmartBill.`;
          } else if (lowerError.includes('cui') || lowerError.includes('vat') || lowerError.includes('cif')) {
            errorMessage = `Eroare internă SmartBill: CUI companie '${companyVatNumber}' poate să nu se potrivească cu cel din cont. Verifică Setări → Date Companie.`;
          } else {
            errorMessage = `Eroare internă SmartBill (500): ${errorMessage}. Verifică că toate configurațiile sunt setate corect în contul SmartBill (serie, CUI companie, produse).`;
          }
        }

        // Log the full error details for debugging
        console.error('[SmartBill] Receipt creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          enhancedMessage: errorMessage,
          payload: {
            seriesName: cleanedPayload.seriesName,
            companyVatNumber: cleanedPayload.companyVatNumber,
            productsCount: cleanedPayload.products?.length,
          },
        });

        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        throw error;
      }

      console.log('[SmartBill] Response OK, parsing JSON');
      const data = await response.json();
      console.log('[SmartBill] Response data parsed', {
        hasSeriesName: !!data.seriesName,
        hasNumber: !!data.number,
        hasPdfUrl: !!data.pdfUrl,
        hasTotal: !!data.total,
        seriesName: data.seriesName,
        number: data.number,
        pdfUrl: data.pdfUrl,
        total: data.total,
        fullData: JSON.stringify(data, null, 2),
      });

      // Validate response structure
      if (!data.number || !data.pdfUrl) {
        console.error('[SmartBill] Invalid response structure', {
          hasNumber: !!data.number,
          hasPdfUrl: !!data.pdfUrl,
          data: JSON.stringify(data, null, 2),
        });
        throw new Error(`Invalid SmartBill API response: missing required fields (number: ${!!data.number}, pdfUrl: ${!!data.pdfUrl})`);
      }

      const result = {
        series: data.seriesName || data.series || receiptInput.series || this.series,
        number: data.number,
        pdfUrl: data.pdfUrl,
        total: data.total || data.totalAmount || 0,
        issuer: 'smartbill',
      };
      
      console.log('[SmartBill] _createReceiptAttempt SUCCESS', {
        result,
        orderId: input.orderId,
      });

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('[SmartBill] _createReceiptAttempt ERROR', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        input: {
          orderId: input.orderId,
          buyerName: input.buyer.name,
          itemsCount: input.items.length,
          series: input.series,
        },
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`SmartBill API request timeout after ${this.REQUEST_TIMEOUT_MS}ms`);
        console.error('[SmartBill] Request timeout', {
          timeoutMs: this.REQUEST_TIMEOUT_MS,
          orderId: input.orderId,
        });
        throw timeoutError;
      }
      
      if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        const connectionError = new Error(`SmartBill API connection error: ${error.message}`);
        console.error('[SmartBill] Connection error', {
          error: error.message,
          orderId: input.orderId,
          apiBase: this.apiBase,
        });
        throw connectionError;
      }
      
      throw error;
    }
  }
}
