import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { SmartBillProvider, ReceiptInput } from "@/lib/invoicing/smartbill";

export const dynamic = 'force-dynamic';

/**
 * Systematic payload variation testing endpoint for SmartBill receipt creation
 * Tests different payload combinations to identify which fields are required
 * 
 * This endpoint helps identify:
 * - Which fields are required for receipt creation
 * - Which fields cause errors when included/excluded
 * - Optimal payload structure for receipts
 */
export async function POST(request: NextRequest) {
  // Get series from query params or use default
  // Defined outside try-catch so it's available in error handling
  const { searchParams } = new URL(request.url);
  const series = searchParams.get('series') || process.env.SMARTBILL_RECEIPT_SERIES || 'CH';
  
  try {
    // Require admin role
    await requireRole(request, ['admin']);

    console.log('[SmartBill Test Payload] Series determination', {
      queryParam: searchParams.get('series'),
      envReceiptSeries: process.env.SMARTBILL_RECEIPT_SERIES,
      finalSeries: series,
    });

    // Initialize SmartBill provider
    const smartbillProvider = new SmartBillProvider();

    // Base receipt input
    const baseReceiptInput: ReceiptInput = {
      orderId: 'test-payload-variations',
      buyer: {
        name: 'Test Client',
        email: 'test@example.com',
      },
      items: [
        {
          name: 'Produs Test',
          qty: 1,
          unitPrice: 100.00,
          vatRate: 19,
        },
      ],
      currency: 'RON' as 'RON' | 'EUR',
      series: series,
    };

    const testResults: Array<{
      testName: string;
      payload: any;
      success: boolean;
      error?: string;
      receipt?: { series: string; number: string };
    }> = [];

    // Test 1: Minimal payload (current baseline)
    try {
      const result = await smartbillProvider.createReceipt(baseReceiptInput);
      testResults.push({
        testName: 'Minimal payload (baseline)',
        payload: { ...baseReceiptInput },
        success: true,
        receipt: { series: result.series, number: result.number },
      });
    } catch (error) {
      testResults.push({
        testName: 'Minimal payload (baseline)',
        payload: { ...baseReceiptInput },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: With paymentMethod
    try {
      const result = await smartbillProvider.createReceipt({
        ...baseReceiptInput,
        paymentMethod: 'card',
      });
      testResults.push({
        testName: 'With paymentMethod',
        payload: { ...baseReceiptInput, paymentMethod: 'card' },
        success: true,
        receipt: { series: result.series, number: result.number },
      });
    } catch (error) {
      testResults.push({
        testName: 'With paymentMethod',
        payload: { ...baseReceiptInput, paymentMethod: 'card' },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: With paymentRef
    try {
      const paymentRef = 'TEST-REF-' + Date.now();
      const result = await smartbillProvider.createReceipt({
        ...baseReceiptInput,
        paymentRef,
      });
      testResults.push({
        testName: 'With paymentRef',
        payload: { ...baseReceiptInput, paymentRef },
        success: true,
        receipt: { series: result.series, number: result.number },
      });
    } catch (error) {
      const paymentRef = 'TEST-REF-' + Date.now();
      testResults.push({
        testName: 'With paymentRef',
        payload: { ...baseReceiptInput, paymentRef },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: With orderNumber
    try {
      const result = await smartbillProvider.createReceipt({
        ...baseReceiptInput,
        orderNumber: 'TEST-ORDER-001',
      });
      testResults.push({
        testName: 'With orderNumber',
        payload: { ...baseReceiptInput, orderNumber: 'TEST-ORDER-001' },
        success: true,
        receipt: { series: result.series, number: result.number },
      });
    } catch (error) {
      testResults.push({
        testName: 'With orderNumber',
        payload: { ...baseReceiptInput, orderNumber: 'TEST-ORDER-001' },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 5: With all optional fields
    try {
      const paymentRef = 'TEST-REF-' + Date.now();
      const result = await smartbillProvider.createReceipt({
        ...baseReceiptInput,
        paymentMethod: 'card',
        paymentRef,
        orderNumber: 'TEST-ORDER-001',
      });
      testResults.push({
        testName: 'With all optional fields',
        payload: {
          ...baseReceiptInput,
          paymentMethod: 'card',
          paymentRef,
          orderNumber: 'TEST-ORDER-001',
        },
        success: true,
        receipt: { series: result.series, number: result.number },
      });
    } catch (error) {
      const paymentRef = 'TEST-REF-' + Date.now();
      testResults.push({
        testName: 'With all optional fields',
        payload: {
          ...baseReceiptInput,
          paymentMethod: 'card',
          paymentRef,
          orderNumber: 'TEST-ORDER-001',
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Analyze results
    const successfulTests = testResults.filter(t => t.success);
    const failedTests = testResults.filter(t => !t.success);
    const commonFields = successfulTests.length > 0
      ? Object.keys(successfulTests[0].payload).filter(key =>
          successfulTests.every(t => key in t.payload)
        )
      : [];

    return NextResponse.json({
      ok: true,
      message: `Completed ${testResults.length} payload variation tests`,
      summary: {
        totalTests: testResults.length,
        successful: successfulTests.length,
        failed: failedTests.length,
        successRate: `${((successfulTests.length / testResults.length) * 100).toFixed(1)}%`,
      },
      testResults,
      analysis: {
        commonFields,
        successfulPayloads: successfulTests.map(t => ({
          testName: t.testName,
          fields: Object.keys(t.payload),
        })),
        failedPayloads: failedTests.map(t => ({
          testName: t.testName,
          fields: Object.keys(t.payload),
          error: t.error,
        })),
        recommendations: successfulTests.length > 0
          ? [
              'Use the payload structure from successful tests',
              `Common fields across successful tests: ${commonFields.join(', ')}`,
              failedTests.length > 0
                ? `Avoid these combinations: ${failedTests.map(t => t.testName).join(', ')}`
                : null,
            ].filter(Boolean)
          : [
              'All tests failed - check SmartBill configuration',
              'Verify receipt series exists and is active',
              'Verify COMPANY_VAT_NUMBER matches SmartBill account',
              'Check error messages for specific field requirements',
            ],
      },
      configuration: {
        companyVatNumber: process.env.COMPANY_VAT_NUMBER || 'missing',
        seriesName: series,
        apiBase: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
        username: process.env.SMARTBILL_USERNAME ? '***configured***' : 'missing',
        token: process.env.SMARTBILL_TOKEN ? '***configured***' : 'missing',
      },
    });

  } catch (error) {
    console.error('[SmartBill Test Payload] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden') ? 403
      : errorMessage.includes('required') || errorMessage.includes('obligator') ? 400
      : errorMessage.includes('404') ? 404
      : errorMessage.includes('401') ? 401
      : 500;

    return NextResponse.json({
      ok: false,
      error: errorMessage,
      message: 'Failed to run payload variation tests',
      configuration: {
        companyVatNumber: process.env.COMPANY_VAT_NUMBER || 'missing',
        receiptSeries: process.env.SMARTBILL_RECEIPT_SERIES || 'CH (default)',
        apiBase: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
        username: process.env.SMARTBILL_USERNAME ? '***configured***' : 'missing',
        token: process.env.SMARTBILL_TOKEN ? '***configured***' : 'missing',
      },
      troubleshooting: {
        step1: 'Verifică că SMARTBILL_USERNAME și SMARTBILL_TOKEN sunt setate corect',
        step2: `Verifică că seria '${series}' există în contul SmartBill`,
        step3: `Verifică că COMPANY_VAT_NUMBER se potrivește cu CUI-ul din contul SmartBill`,
      },
      errorStack: error instanceof Error ? error.stack : undefined,
    }, { status: statusCode });
  }
}
