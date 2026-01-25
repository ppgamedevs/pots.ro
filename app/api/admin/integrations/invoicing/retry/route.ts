import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Retry all failed invoices in bulk.
 * This queues them for retry via the regenerate endpoint logic.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 3 bulk retries per hour per admin
    await checkRateLimit(`admin_invoicing_bulk_retry_${user.id}`, 3, 60 * 60 * 1000);

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(parseInt(body?.limit || '10', 10), 1), 50);
    const issuer = (body?.issuer || '').trim();

    // Build conditions
    const conditions = [eq(invoices.status, 'error')];
    
    // Only retry non-seller invoices (seller invoices are uploaded, not generated)
    conditions.push(
      and(
        eq(invoices.status, 'error'),
        // Can't use NOT with drizzle easily, so we filter in app
      ) as any
    );

    if (issuer && issuer !== 'all') {
      conditions.push(eq(invoices.issuer, issuer as any));
    }

    // Get failed invoices
    const failedInvoices = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        type: invoices.type,
        series: invoices.series,
        number: invoices.number,
        issuer: invoices.issuer,
        errorMessage: invoices.errorMessage,
      })
      .from(invoices)
      .where(and(...conditions))
      .limit(limit);

    // Filter out seller invoices (they can't be regenerated)
    const retryable = failedInvoices.filter((inv: typeof failedInvoices[number]) => inv.issuer !== 'seller');

    if (retryable.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No retryable failed invoices found',
        queued: 0,
        skipped: failedInvoices.length,
      });
    }

    // Log the bulk retry request
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'invoicing_bulk_retry_requested',
      entityType: 'integration',
      entityId: 'invoicing',
      message: `Bulk invoice retry requested for ${retryable.length} invoices`,
      meta: {
        invoiceIds: retryable.map((inv: typeof retryable[number]) => inv.id),
        issuer: issuer || 'all',
        requestedCount: retryable.length,
        skippedCount: failedInvoices.length - retryable.length,
      },
    });

    // Return list of invoices that can be retried
    // The frontend should call /api/admin/invoices/[id]/regenerate for each
    return NextResponse.json({
      ok: true,
      message: `Found ${retryable.length} invoices eligible for retry`,
      queued: retryable.length,
      skipped: failedInvoices.length - retryable.length,
      invoices: retryable.map((inv: typeof retryable[number]) => ({
        id: inv.id,
        orderId: inv.orderId,
        type: inv.type,
        series: inv.series,
        number: inv.number,
        issuer: inv.issuer,
        errorMessage: inv.errorMessage,
        retryUrl: `/api/admin/invoices/${inv.id}/regenerate`,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    if (message.includes('Rate limit')) {
      return NextResponse.json({ ok: false, error: message }, { status: 429 });
    }
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
