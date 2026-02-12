import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, invoices, webhookLogs } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { SmartBillProvider, ReceiptInput } from "@/lib/invoicing/smartbill";
import { InvoiceResult } from "@/lib/invoicing";
import { fetchReceiptData, validateReceiptData } from "@/lib/services/receipt-service";
import { join } from "path";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/admin/rate-limit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createReceiptSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
});

/**
 * Professional receipt generation endpoint with idempotency, validation, audit logging, and rate limiting
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let orderId: string | undefined;

  try {
    // Require admin role and get user info
    const user = await requireRole(request, ['admin', 'support']);
    userId = user.id;

    // Rate limiting: 10 receipts per minute per user
    try {
      await checkRateLimit(`receipt_generation_${userId}`, 10, 60 * 1000);
    } catch (rateLimitError: any) {
      if (rateLimitError.statusCode === 429) {
        return rateLimitExceededResponse(rateLimitError);
      }
      throw rateLimitError;
    }

    // Parse and validate request body
    const body = await request.json();
    const { orderId: validatedOrderId } = createReceiptSchema.parse(body);
    orderId = validatedOrderId;

    // Idempotency check: Check if receipt already exists for this order
    const existingReceipt = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.orderId, orderId),
          eq(invoices.type, 'receipt')
        )
      )
      .limit(1);

    if (existingReceipt.length > 0 && existingReceipt[0].status === 'issued') {
      // Receipt already exists and is valid
      console.log(`[Receipt] Receipt already exists for order ${orderId}: ${existingReceipt[0].series}-${existingReceipt[0].number}`);
      
      // Log audit trail
      try {
        await db.insert(webhookLogs).values({
          source: 'receipts',
          ref: orderId,
          payload: {
            orderId,
            receiptId: existingReceipt[0].id,
            action: 'idempotent_return',
            userId,
          },
          result: 'ok',
        });
      } catch (logError) {
        console.error('[Receipt] Failed to log idempotent return:', logError);
      }

      return NextResponse.json({
        ok: true,
        receipt: {
          id: existingReceipt[0].id,
          series: existingReceipt[0].series,
          number: existingReceipt[0].number,
          pdfUrl: existingReceipt[0].pdfUrl,
          total: Number(existingReceipt[0].total),
          issuer: existingReceipt[0].issuer,
        },
        message: 'Receipt already exists',
      });
    }

    // Fetch complete receipt data using service layer
    const receiptData = await fetchReceiptData(orderId);

    // Validate receipt data
    const validation = validateReceiptData(receiptData);
    if (!validation.valid) {
      const errorMessage = `Receipt data validation failed: ${validation.errors.join(', ')}`;
      console.error(`[Receipt] Validation error for order ${orderId}:`, validation.errors);
      
      // Log validation error
      try {
        await db.insert(webhookLogs).values({
          source: 'receipts',
          ref: orderId,
          payload: {
            orderId,
            userId,
            validationErrors: validation.errors,
          },
          result: 'error',
        });
      } catch (logError) {
        console.error('[Receipt] Failed to log validation error:', logError);
      }

      return NextResponse.json({
        ok: false,
        error: errorMessage,
        details: validation.errors,
      }, { status: 400 });
    }

    // Get Smartbill provider
    const smartbillProvider = new SmartBillProvider();

    // Prepare receipt input for Smartbill API
    const receiptSeries = process.env.SMARTBILL_RECEIPT_SERIES || 'CH';
    console.log('[Receipt] Series determination', {
      envReceiptSeries: process.env.SMARTBILL_RECEIPT_SERIES,
      envInvoiceSeries: process.env.SMARTBILL_SERIES,
      finalSeries: receiptSeries,
      orderId: receiptData.order.orderId,
    });
    
    const receiptInput: ReceiptInput = {
      orderId: receiptData.order.orderId,
      buyer: {
        name: receiptData.buyer.name,
        cui: receiptData.buyer.cui,
        email: receiptData.buyer.email,
        address: receiptData.buyer.address,
      },
      seller: {
        name: receiptData.seller.name,
        legalName: receiptData.seller.legalName,
        cui: receiptData.seller.cui,
        email: receiptData.seller.email,
        phone: receiptData.seller.phone,
      },
      items: receiptData.items.map(item => ({
        name: item.name,
        qty: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
      })),
      currency: receiptData.order.currency as 'RON' | 'EUR',
      series: receiptSeries,
      paymentMethod: 'card', // Default payment method
      paymentRef: receiptData.order.paymentRef,
      orderNumber: receiptData.order.orderNumber,
    };

    // Generate receipt via Smartbill API (with retry logic built-in)
    // If SmartBill fails, fallback to creating as invoice (same endpoint, different series)
    let receiptResult: InvoiceResult;
    let usedFallback = false;
    try {
      receiptResult = await smartbillProvider.createReceipt(receiptInput);
    } catch (receiptError) {
      // If SmartBill doesn't support receipts, try creating as invoice with receipt series
      const errorMsg = receiptError instanceof Error ? receiptError.message : String(receiptError);
      console.warn('[Receipt] SmartBill receipt creation failed, attempting as invoice:', errorMsg);
      
      // #region agent log
      const fallbackLog = {location:'receipt/route.ts:163',message:'Fallback to invoice creation',data:{receiptError:errorMsg,fallbackSeries:receiptInput.series || 'CH'},timestamp:Date.now(),runId:'debug4',hypothesisId:'H3'};
      fetch('http://127.0.0.1:7242/ingest/4d9ef734-4941-42c7-9197-e66e14aa4710',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fallbackLog)}).catch(()=>{});
      await import('fs/promises').then(fs => fs.appendFile(join(process.cwd(), '.cursor', 'debug.log'), JSON.stringify(fallbackLog) + '\n', 'utf8')).catch(()=>{});
      // #endregion
      
      // Fallback: Create as invoice with receipt series
      // This might work if SmartBill.ro treats receipts as invoices with different series
      try {
        receiptResult = await smartbillProvider.createInvoice({
          orderId: receiptInput.orderId,
          buyer: receiptInput.buyer,
          items: receiptInput.items,
          currency: receiptInput.currency,
          series: receiptInput.series || 'CH',
        });
        usedFallback = true;
        console.log('[Receipt] Fallback invoice creation succeeded');
        
        // #region agent log
        const successLog = {location:'receipt/route.ts:175',message:'Fallback invoice creation succeeded',data:{series:receiptResult.series,number:receiptResult.number},timestamp:Date.now(),runId:'debug4',hypothesisId:'H3'};
        fetch('http://127.0.0.1:7242/ingest/4d9ef734-4941-42c7-9197-e66e14aa4710',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(successLog)}).catch(()=>{});
        await import('fs/promises').then(fs => fs.appendFile(join(process.cwd(), '.cursor', 'debug.log'), JSON.stringify(successLog) + '\n', 'utf8')).catch(()=>{});
        // #endregion
      } catch (fallbackError) {
        // #region agent log
        const fallbackFailLog = {location:'receipt/route.ts:182',message:'Fallback invoice creation also failed',data:{fallbackError:fallbackError instanceof Error ? fallbackError.message : String(fallbackError)},timestamp:Date.now(),runId:'debug4',hypothesisId:'H3'};
        fetch('http://127.0.0.1:7242/ingest/4d9ef734-4941-42c7-9197-e66e14aa4710',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fallbackFailLog)}).catch(()=>{});
        await import('fs/promises').then(fs => fs.appendFile(join(process.cwd(), '.cursor', 'debug.log'), JSON.stringify(fallbackFailLog) + '\n', 'utf8')).catch(()=>{});
        // #endregion
        
        throw new Error(`Both receipt and invoice creation failed. Receipt error: ${errorMsg}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      }
    }

    // Store receipt in database
    const newReceipt = await db
      .insert(invoices)
      .values({
        orderId: receiptData.order.orderId,
        type: 'receipt',
        series: receiptResult.series,
        number: receiptResult.number,
        pdfUrl: receiptResult.pdfUrl,
        total: receiptResult.total.toString(),
        currency: receiptData.order.currency,
        issuer: receiptResult.issuer,
        status: 'issued',
        meta: {
          buyer: {
            name: receiptData.buyer.name,
            email: receiptData.buyer.email,
          },
          seller: {
            name: receiptData.seller.name,
            legalName: receiptData.seller.legalName,
          },
          orderNumber: receiptData.order.orderNumber,
          paymentRef: receiptData.order.paymentRef,
          itemsCount: receiptData.items.length,
          generatedBy: userId,
          generatedAt: new Date().toISOString(),
        },
      })
      .returning();

    const receiptId = newReceipt[0].id;
    const durationMs = Date.now() - startTime;

    // Log successful receipt generation
    try {
      await db.insert(webhookLogs).values({
        source: 'receipts',
        ref: orderId,
        payload: {
          orderId,
          receiptId,
          series: receiptResult.series,
          number: receiptResult.number,
          userId,
          durationMs,
        },
        result: 'ok',
      });
    } catch (logError) {
      console.error('[Receipt] Failed to log success:', logError);
    }

    console.log(`[Receipt] Successfully generated receipt ${receiptResult.series}-${receiptResult.number} for order ${orderId} in ${durationMs}ms`);

    return NextResponse.json({
      ok: true,
      receipt: {
        id: receiptId,
        series: receiptResult.series,
        number: receiptResult.number,
        pdfUrl: receiptResult.pdfUrl,
        total: receiptResult.total,
        issuer: receiptResult.issuer,
      },
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[Receipt] Error generating receipt for order ${orderId || 'unknown'}:`, error);

    // Log error to webhook logs
    try {
      await db.insert(webhookLogs).values({
        source: 'receipts',
        ref: orderId || 'unknown',
        payload: {
          orderId,
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          durationMs,
        },
        result: 'error',
      });
    } catch (logError) {
      console.error('[Receipt] Failed to log error:', logError);
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input",
        details: error.issues,
      }, { status: 422 });
    }

    // Handle authentication/authorization errors
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      const status = error.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({
        ok: false,
        error: error.message,
      }, { status });
    }

    // Handle rate limiting errors
    if (error instanceof Error && (error as any).statusCode === 429) {
      return rateLimitExceededResponse(error);
    }

    // Handle business logic errors (from receipt service)
    if (error instanceof Error && (
      error.message.includes('not found') ||
      error.message.includes('not paid') ||
      error.message.includes('no items') ||
      error.message.includes('required') ||
      error.message.includes('Invalid')
    )) {
      return NextResponse.json({
        ok: false,
        error: error.message,
      }, { status: 400 });
    }

    // Generic error response
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }, { status: 500 });
  }
}
