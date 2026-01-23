import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logWebhook } from '@/lib/webhook-logging';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/refunds/[id]/mark-failed
 * Manual operator action with reasonCode (stored in audit meta) + failureReason on refund row.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reasonCode = String(body?.reasonCode || '').trim();
    const reason = String(body?.reason || '').trim();

    if (!reasonCode || !reason) {
      return NextResponse.json({ error: 'reasonCode and reason are required' }, { status: 400 });
    }

    const refund = await db.query.refunds.findFirst({ where: eq(refunds.id, id) });
    if (!refund) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (refund.status === 'refunded') {
      return NextResponse.json({ error: 'Already refunded' }, { status: 409 });
    }

    const failureReason = `manual_failed:${reasonCode}`;
    await db.update(refunds).set({ status: 'failed', failureReason }).where(eq(refunds.id, id));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'refund_mark_failed',
      entityType: 'refund',
      entityId: id,
      message: 'Refund marked failed (manual)',
      meta: { orderId: refund.orderId, reasonCode, reason },
    });

    await logWebhook({
      source: 'refunds',
      ref: refund.orderId,
      payload: { action: 'mark_failed', refundId: id, reasonCode, reason },
      result: 'ok',
    });

    return NextResponse.json({ ok: true, refundId: id, status: 'failed', failureReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
