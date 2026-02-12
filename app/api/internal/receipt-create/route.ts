import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, webhookLogs } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { SmartBillProvider, ReceiptInput } from "@/lib/invoicing/smartbill";
import { fetchReceiptData, validateReceiptData } from "@/lib/services/receipt-service";
import { InvoiceResult } from "@/lib/invoicing";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createReceiptSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
});

/**
 * Internal receipt creation endpoint for automatic receipt generation
 * Called by payment processors (e.g., Netopia) after successful payment
 * Does not require admin authentication - uses internal service calls
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let orderId: string | undefined;

  try {
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
      console.log(`[Internal Receipt] Receipt already exists for order ${orderId}: ${existingReceipt[0].series}-${existingReceipt[0].number}`);
      
      // Log audit trail
      try {
        await db.insert(webhookLogs).values({
          source: 'receipts',
          ref: orderId,
          payload: {
            orderId,
            receiptId: existingReceipt[0].id,
            action: 'idempotent_return',
            source: 'internal',
          },
          result: 'ok',
        });
      } catch (logError) {
        console.error('[Internal Receipt] Failed to log idempotent return:', logError);
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
      console.error(`[Internal Receipt] Validation error for order ${orderId}:`, validation.errors);
      
      // Log validation error
      try {
        await db.insert(webhookLogs).values({
          source: 'receipts',
          ref: orderId,
          payload: {
            orderId,
            validationErrors: validation.errors,
            source: 'internal',
          },
          result: 'error',
        });
      } catch (logError) {
        console.error('[Internal Receipt] Failed to log validation error:', logError);
      }

      return NextResponse.json({
        ok: false,
        error: errorMessage,
        details: validation.errors,
      }, { status: 400 });
    }

    // Always use SmartBill provider for receipts (regardless of INVOICE_PROVIDER setting)
    const smartbillProvider = new SmartBillProvider();

    // Prepare receipt input for Smartbill API
    const receiptSeries = process.env.SMARTBILL_RECEIPT_SERIES || 'CH';
    console.log('[Receipt] Series determination (internal)', {
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
      console.warn('[Internal Receipt] SmartBill receipt creation failed, attempting as invoice:', errorMsg);
      
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
        console.log('[Internal Receipt] Fallback invoice creation succeeded');
      } catch (fallbackError) {
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
          generatedBy: 'system',
          generatedAt: new Date().toISOString(),
          usedFallback,
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
          source: 'internal',
          durationMs,
          usedFallback,
        },
        result: 'ok',
      });
    } catch (logError) {
      console.error('[Internal Receipt] Failed to log success:', logError);
    }

    console.log(`[Internal Receipt] Successfully generated receipt ${receiptResult.series}-${receiptResult.number} for order ${orderId} in ${durationMs}ms`);

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
    console.error(`[Internal Receipt] Error generating receipt for order ${orderId || 'unknown'}:`, error);

    // Log error to webhook logs
    try {
      await db.insert(webhookLogs).values({
        source: 'receipts',
        ref: orderId || 'unknown',
        payload: {
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          durationMs,
          source: 'internal',
        },
        result: 'error',
      });
    } catch (logError) {
      console.error('[Internal Receipt] Failed to log error:', logError);
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input",
        details: error.issues,
      }, { status: 422 });
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
