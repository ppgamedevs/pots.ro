import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, orders } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'support']);

    // Rate limit: max 20 uploads per minute per admin
    await checkRateLimit(`admin_invoice_upload_${user.id}`, 20, 60_000);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('orderId') as string | null;
    const sellerInvoiceNumber = formData.get('sellerInvoiceNumber') as string | null;
    const total = formData.get('total') as string | null;
    const currency = (formData.get('currency') as string | null) || 'RON';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!sellerInvoiceNumber) {
      return NextResponse.json({ error: 'Seller invoice number is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Verify order exists
    const [order] = await db
      .select({ id: orders.id, sellerId: orders.sellerId, totalCents: orders.totalCents, currency: orders.currency })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if seller invoice already exists for this order
    const [existingInvoice] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.orderId, orderId), eq(invoices.type, 'seller')))
      .limit(1);

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'A seller invoice already exists for this order. Void it first to upload a new one.' },
        { status: 400 }
      );
    }

    // Upload file to blob storage
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'pdf';
    const blobName = `invoices/seller/${orderId}_${timestamp}.${ext}`;

    const blob = await put(blobName, file, {
      access: 'public', // Will use signed URLs in actual implementation
      contentType: file.type,
    });

    // Create invoice record
    const invoiceTotal = total ? parseFloat(total) : order.totalCents / 100;
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        orderId,
        type: 'seller',
        series: 'SELLER',
        number: sellerInvoiceNumber,
        sellerInvoiceNumber,
        pdfUrl: blob.url,
        total: String(invoiceTotal),
        currency: currency as any,
        issuer: 'seller',
        status: 'issued',
        uploadedBy: user.id,
        uploadedAt: new Date(),
      })
      .returning();

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'seller_invoice_uploaded',
      entityType: 'invoice',
      entityId: newInvoice.id,
      message: `Seller invoice uploaded: ${sellerInvoiceNumber}`,
      meta: {
        invoiceId: newInvoice.id,
        orderId,
        sellerInvoiceNumber,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        blobUrl: blob.url,
      },
    });

    return NextResponse.json({
      ok: true,
      data: newInvoice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Rate limit')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
