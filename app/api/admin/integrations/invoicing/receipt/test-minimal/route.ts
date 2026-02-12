import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { SmartBillProvider, ReceiptInput } from "@/lib/invoicing/smartbill";

export const dynamic = 'force-dynamic';

/**
 * Minimal test endpoint for SmartBill receipt creation
 * Uses hardcoded minimal payload to test SmartBill configuration
 * 
 * This endpoint helps verify that:
 * - SmartBill credentials are correct
 * - COMPANY_VAT_NUMBER matches SmartBill account
 * - Receipt series exists and is active
 * - Basic API connectivity works
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole(request, ['admin']);

    // Get series from query params or use default (never use SMARTBILL_SERIES for receipts)
    const { searchParams } = new URL(request.url);
    const series = searchParams.get('series') || process.env.SMARTBILL_RECEIPT_SERIES || 'CH';
    
    console.log('[SmartBill Test] Series determination', {
      queryParam: searchParams.get('series'),
      envReceiptSeries: process.env.SMARTBILL_RECEIPT_SERIES,
      envInvoiceSeries: process.env.SMARTBILL_SERIES,
      finalSeries: series,
    });

    // Create minimal test payload
    // This is the absolute minimum required by SmartBill API
    const testPayload = {
      companyVatNumber: process.env.COMPANY_VAT_NUMBER || 'RO12345678',
      seriesName: series,
      currency: 'RON',
      language: 'RO',
      client: {
        name: 'Test Client',
        email: 'test@example.com',
      },
      products: [
        {
          name: 'Produs Test',
          quantity: 1,
          price: 100.00,
          vatRate: 19,
        },
      ],
    };

    console.log('[SmartBill Test] Attempting minimal receipt creation with payload:', JSON.stringify(testPayload, null, 2));
    console.log('[SmartBill Test] Configuration check', {
      companyVatNumber: testPayload.companyVatNumber,
      seriesName: testPayload.seriesName,
      apiBase: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
      hasUsername: !!process.env.SMARTBILL_USERNAME,
      hasToken: !!process.env.SMARTBILL_TOKEN,
    });

    // Initialize SmartBill provider
    const smartbillProvider = new SmartBillProvider();

    // Try to create receipt using createReceipt method (not createInvoice)
    // This will use the correct receipt creation logic with receipt-specific fields
    const receiptInput: ReceiptInput = {
      orderId: 'test-minimal',
      buyer: {
        name: testPayload.client.name,
        email: testPayload.client.email,
      },
      items: testPayload.products.map(p => ({
        name: p.name,
        qty: p.quantity,
        unitPrice: p.price,
        vatRate: p.vatRate,
      })),
      currency: testPayload.currency as 'RON' | 'EUR',
      series: testPayload.seriesName,
      paymentMethod: 'card', // Receipt-specific field
      paymentRef: 'TEST-' + Date.now(), // Receipt-specific field
      orderNumber: 'TEST-ORDER-001', // Receipt-specific field
    };
    
    console.log('[SmartBill Test] Calling createReceipt with receipt-specific fields:', {
      series: receiptInput.series,
      buyerName: receiptInput.buyer.name,
      itemsCount: receiptInput.items.length,
      paymentMethod: receiptInput.paymentMethod,
      paymentRef: receiptInput.paymentRef,
      orderNumber: receiptInput.orderNumber,
      hasIssueDate: true, // Will be added automatically in _createReceiptAttempt
      hasPaymentDate: true, // Will be added automatically in _createReceiptAttempt
      hasIsDraft: true, // Will be set to false automatically in _createReceiptAttempt
    });
    
    const result = await smartbillProvider.createReceipt(receiptInput);

    return NextResponse.json({
      ok: true,
      message: 'Test receipt created successfully',
      receipt: {
        series: result.series,
        number: result.number,
        pdfUrl: result.pdfUrl,
        total: result.total,
      },
      testPayload,
      configuration: {
        companyVatNumber: testPayload.companyVatNumber,
        seriesName: testPayload.seriesName,
        apiBase: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
        username: process.env.SMARTBILL_USERNAME ? '***configured***' : 'missing',
        token: process.env.SMARTBILL_TOKEN ? '***configured***' : 'missing',
      },
    });

  } catch (error) {
    console.error('[SmartBill Test] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden') ? 403
      : errorMessage.includes('required') || errorMessage.includes('obligator') ? 400
      : errorMessage.includes('404') ? 404
      : errorMessage.includes('401') ? 401
      : 500;

    return NextResponse.json({
      ok: false,
      error: errorMessage,
      configuration: {
        companyVatNumber: process.env.COMPANY_VAT_NUMBER || 'missing',
        receiptSeries: process.env.SMARTBILL_RECEIPT_SERIES || 'CH (default)',
        invoiceSeries: process.env.SMARTBILL_SERIES || 'PO (default)',
        apiBase: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
        username: process.env.SMARTBILL_USERNAME ? '***configured***' : 'missing',
        token: process.env.SMARTBILL_TOKEN ? '***configured***' : 'missing',
      },
      troubleshooting: {
        step1: 'Verifică că SMARTBILL_USERNAME și SMARTBILL_TOKEN sunt setate corect (Contul meu → Integrări → API)',
        step2: `Verifică că seria '${series}' există în contul SmartBill (Setări → Serii Documente) și că tipul documentului este "Chitanță" (nu "Factură")`,
        step3: `Verifică că COMPANY_VAT_NUMBER '${process.env.COMPANY_VAT_NUMBER || 'missing'}' se potrivește EXACT cu CUI-ul din contul SmartBill (Setări → Date Companie)`,
        step4: 'Verifică log-urile console pentru payload-ul complet trimis și răspunsul SmartBill',
        step5: 'Verifică fișierele de log în .cursor/ pentru detalii complete despre eroare',
      },
      testPayload: testPayload,
      receiptInputFields: {
        series: receiptInput.series,
        paymentMethod: receiptInput.paymentMethod,
        paymentRef: receiptInput.paymentRef,
        orderNumber: receiptInput.orderNumber,
        note: 'Receipt-specific fields (issueDate, paymentDate, isDraft) are added automatically',
      },
      errorStack: error instanceof Error ? error.stack : undefined,
    }, { status: statusCode });
  }
}
