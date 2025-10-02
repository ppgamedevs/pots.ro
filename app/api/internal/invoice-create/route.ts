import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, webhookLogs } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getInvoiceProvider } from "@/lib/invoicing";
import { z } from "zod";

const createInvoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { orderId } = createInvoiceSchema.parse(body);

    // Check if invoice already exists (idempotency)
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId))
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json({
        ok: true,
        invoiceId: existingInvoice[0].id,
        message: "Invoice already exists",
      });
    }

    // Load order with items and buyer info
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Get order items
    const orderItemsResult = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (orderItemsResult.length === 0) {
      return NextResponse.json({ ok: false, error: "Order has no items" }, { status: 400 });
    }

    // Prepare invoice input
    const shippingAddress = order.shippingAddress as any;
    const invoiceInput = {
      orderId,
      buyer: {
        name: shippingAddress?.name || 'Unknown',
        email: shippingAddress?.email,
        address: shippingAddress,
      },
      items: orderItemsResult.map(item => ({
        name: `Product ${item.productId}`, // In real implementation, join with products table
        qty: item.qty,
        unitPrice: item.unitPriceCents / 100,
        vatRate: parseFloat(process.env.INVOICE_DEFAULT_VAT || '19'),
      })),
      currency: order.currency as 'RON' | 'EUR',
    };

    // Create invoice using provider
    const invoiceProvider = getInvoiceProvider();
    const invoiceResult = await invoiceProvider.createInvoice(invoiceInput);

    // Save invoice to database
    const newInvoice = await db
      .insert(invoices)
      .values({
        orderId,
        series: invoiceResult.series,
        number: invoiceResult.number,
        pdfUrl: invoiceResult.pdfUrl,
        total: invoiceResult.total.toString(),
        currency: order.currency,
        issuer: invoiceResult.issuer,
        status: 'issued',
      })
      .returning();

    // Log webhook event
    await db.insert(webhookLogs).values({
      source: 'invoices',
      ref: orderId,
      payload: {
        orderId,
        invoiceId: newInvoice[0].id,
        provider: invoiceResult.issuer,
      },
      result: 'ok',
    });

    return NextResponse.json({
      ok: true,
      invoiceId: newInvoice[0].id,
      invoice: {
        series: invoiceResult.series,
        number: invoiceResult.number,
        pdfUrl: invoiceResult.pdfUrl,
        total: invoiceResult.total,
        issuer: invoiceResult.issuer,
      },
    });

  } catch (error) {
    console.error("Create invoice error:", error);

    // Log error to webhook logs
    try {
      await db.insert(webhookLogs).values({
        source: 'invoices',
        ref: 'unknown',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        result: 'error',
      });
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
