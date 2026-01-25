import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, orders, orderItems, users, sellers, products } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';
import { getInvoiceProvider } from '@/lib/invoicing';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    // Rate limit: max 5 regenerates per minute per admin
    await checkRateLimit(`admin_invoice_regenerate_${user.id}`, 5, 60_000);

    // Get the invoice with order details
    const [invoice] = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        type: invoices.type,
        series: invoices.series,
        number: invoices.number,
        issuer: invoices.issuer,
        status: invoices.status,
        currency: invoices.currency,
      })
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'error') {
      return NextResponse.json(
        { error: 'Can only regenerate invoices with error status' },
        { status: 400 }
      );
    }

    if (invoice.issuer === 'seller') {
      return NextResponse.json(
        { error: 'Cannot regenerate seller-uploaded invoices' },
        { status: 400 }
      );
    }

    // Get order details
    const [order] = await db
      .select({
        id: orders.id,
        buyerId: orders.buyerId,
        sellerId: orders.sellerId,
        totalCents: orders.totalCents,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(eq(orders.id, invoice.orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get buyer details
    const [buyer] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, order.buyerId))
      .limit(1);

    // Get order items with product details
    const items = await db
      .select({
        name: products.name,
        qty: orderItems.qty,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    // Build invoice input
    const address = order.shippingAddress as any;
    const invoiceInput = {
      orderId: order.id,
      buyer: {
        name: buyer?.name || address?.recipientName || 'Client',
        cui: address?.cui,
        email: buyer?.email,
        address: address,
      },
      items: items.map(item => ({
        name: item.name || 'Produs',
        qty: item.qty,
        unitPrice: item.unitPriceCents / 100,
        vatRate: 19, // Default VAT rate for Romania
      })),
      currency: (order.currency || 'RON') as 'RON' | 'EUR',
      series: invoice.series,
    };

    // Try to regenerate invoice
    try {
      const provider = getInvoiceProvider();
      const result = await provider.createInvoice(invoiceInput);

      // Update invoice record
      const [updated] = await db
        .update(invoices)
        .set({
          series: result.series,
          number: result.number,
          pdfUrl: result.pdfUrl,
          total: String(result.total),
          status: 'issued',
          errorMessage: null,
          updatedAt: new Date(),
          meta: {
            regeneratedBy: user.id,
            regeneratedAt: new Date().toISOString(),
            previousStatus: 'error',
          },
        })
        .where(eq(invoices.id, id))
        .returning();

      // Audit log
      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'invoice_regenerated',
        entityType: 'invoice',
        entityId: id,
        message: `Invoice regenerated: ${result.series}-${result.number}`,
        meta: {
          invoiceId: id,
          orderId: order.id,
          newSeries: result.series,
          newNumber: result.number,
          issuer: result.issuer,
        },
      });

      return NextResponse.json({
        ok: true,
        data: updated,
      });
    } catch (providerError) {
      const errorMessage = providerError instanceof Error ? providerError.message : 'Unknown error';

      // Update invoice with new error
      await db
        .update(invoices)
        .set({
          errorMessage,
          updatedAt: new Date(),
          meta: {
            lastRegenerateAttempt: new Date().toISOString(),
            lastRegenerateBy: user.id,
            lastRegenerateError: errorMessage,
          },
        })
        .where(eq(invoices.id, id));

      // Audit log
      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'invoice_regenerate_failed',
        entityType: 'invoice',
        entityId: id,
        message: `Invoice regeneration failed: ${errorMessage}`,
        meta: {
          invoiceId: id,
          orderId: order.id,
          error: errorMessage,
        },
      });

      return NextResponse.json(
        { error: `Failed to regenerate invoice: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Rate limit')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
