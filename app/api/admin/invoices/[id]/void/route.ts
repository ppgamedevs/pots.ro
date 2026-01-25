import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, orders } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    // Rate limit: max 10 voids per minute per admin
    await checkRateLimit(`admin_invoice_void_${user.id}`, 10, 60_000);

    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason || '').trim();

    if (!reason) {
      return NextResponse.json({ error: 'Void reason is required' }, { status: 400 });
    }

    // Get the invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'voided') {
      return NextResponse.json({ error: 'Invoice is already voided' }, { status: 400 });
    }

    // Update invoice to voided
    const [updated] = await db
      .update(invoices)
      .set({
        status: 'voided',
        voidedBy: user.id,
        voidedAt: new Date(),
        voidReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'invoice_voided',
      entityType: 'invoice',
      entityId: id,
      message: `Invoice ${invoice.series}-${invoice.number} voided`,
      meta: {
        invoiceId: id,
        series: invoice.series,
        number: invoice.number,
        type: invoice.type,
        orderId: invoice.orderId,
        reason,
        previousStatus: invoice.status,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
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
