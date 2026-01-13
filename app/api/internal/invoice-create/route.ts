import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, webhookLogs, products, sellers } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getInvoiceProvider } from "@/lib/invoicing";
import { createCommissionInvoice } from "@/lib/invoicing/commission";
import { z } from "zod";

const createInvoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  invoiceType: z.enum(['commission', 'platform']).optional().default('commission'), // 'commission' = factura de comision, 'platform' = factura pentru produsele platformei
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { orderId, invoiceType } = createInvoiceSchema.parse(body);

    // Check if invoice of this type already exists (idempotency)
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.orderId, orderId),
          eq(invoices.type, invoiceType)
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json({
        ok: true,
        invoiceId: existingInvoice[0].id,
        message: `Invoice of type ${invoiceType} already exists`,
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

    // Get order items with product and seller info
    const orderItemsResult = await db
      .select({
        orderItem: orderItems,
        product: products,
        seller: sellers,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(eq(orderItems.orderId, orderId));

    if (orderItemsResult.length === 0) {
      return NextResponse.json({ ok: false, error: "Order has no items" }, { status: 400 });
    }

    const shippingAddress = order.shippingAddress as any;
    const buyer = {
      name: shippingAddress?.name || 'Unknown',
      email: shippingAddress?.email,
      address: shippingAddress,
    };

    let invoiceResult;

    if (invoiceType === 'commission') {
      // Emite doar factura de comision
      const totalCommissionCents = orderItemsResult.reduce(
        (sum, item) => sum + item.orderItem.commissionAmountCents,
        0
      );

      if (totalCommissionCents === 0) {
        return NextResponse.json({ 
          ok: false, 
          error: "No commission to invoice" 
        }, { status: 400 });
      }

      invoiceResult = await createCommissionInvoice(
        orderId,
        totalCommissionCents,
        order.currency,
        buyer
      );
    } else if (invoiceType === 'platform') {
      // Emite factura pentru produsele proprii ale platformei
      // Filtrează doar produsele care aparțin platformei (seller.isPlatform = true)
      const platformItems = orderItemsResult.filter(item => item.seller.isPlatform);

      if (platformItems.length === 0) {
        return NextResponse.json({ 
          ok: false, 
          error: "No platform products in this order" 
        }, { status: 400 });
      }

      const invoiceProvider = getInvoiceProvider();
      const invoiceInput = {
        orderId,
        buyer,
        items: platformItems.map((item) => ({
          name: item.product.title,
          qty: item.orderItem.qty,
          unitPrice: item.orderItem.unitPriceCents / 100,
          vatRate: parseFloat(process.env.INVOICE_DEFAULT_VAT || '19'),
        })),
        currency: order.currency as 'RON' | 'EUR',
        series: 'PO', // Serie pentru produsele platformei
      };

      invoiceResult = await invoiceProvider.createInvoice(invoiceInput);
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid invoice type" 
      }, { status: 400 });
    }

    // Save invoice to database
    const newInvoice = await db
      .insert(invoices)
      .values({
        orderId,
        type: invoiceType,
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
