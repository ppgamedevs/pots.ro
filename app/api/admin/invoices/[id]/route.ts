import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, orders, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ['admin', 'support']);
    const { id } = await params;

    const [row] = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        orderNumber: orders.orderNumber,
        type: invoices.type,
        series: invoices.series,
        number: invoices.number,
        pdfUrl: invoices.pdfUrl,
        total: invoices.total,
        currency: invoices.currency,
        issuer: invoices.issuer,
        status: invoices.status,
        errorMessage: invoices.errorMessage,
        voidedBy: invoices.voidedBy,
        voidedAt: invoices.voidedAt,
        voidReason: invoices.voidReason,
        meta: invoices.meta,
        sellerInvoiceNumber: invoices.sellerInvoiceNumber,
        uploadedBy: invoices.uploadedBy,
        uploadedAt: invoices.uploadedAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        // Order details
        sellerId: orders.sellerId,
        buyerId: orders.buyerId,
        orderTotal: orders.totalCents,
        orderCurrency: orders.currency,
        orderStatus: orders.status,
        // Seller details
        sellerName: sellers.storeName,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch voided by user info if available
    let voidedByUser = null;
    if (row.voidedBy) {
      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, row.voidedBy))
        .limit(1);
      voidedByUser = user || null;
    }

    // Fetch uploaded by user info if available
    let uploadedByUser = null;
    if (row.uploadedBy) {
      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, row.uploadedBy))
        .limit(1);
      uploadedByUser = user || null;
    }

    return NextResponse.json({
      data: {
        ...row,
        voidedByUser,
        uploadedByUser,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
