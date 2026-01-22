import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, refunds } from '@/db/schema/core';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { processRefund } from '@/lib/refunds/process';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logOrderAction } from '@/lib/audit';
import { logWebhook } from '@/lib/webhook-logging';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/refunds/[id]/approve
 * Second-person approval for large refunds.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const refund = await db.query.refunds.findFirst({ where: eq(refunds.id, id) });
    if (!refund) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (refund.status !== 'pending' || refund.failureReason !== 'approval_required') {
      return NextResponse.json({ error: 'Refund is not awaiting approval' }, { status: 409 });
    }

    const requestedLog = await db
      .select()
      .from(adminAuditLogs)
      .where(and(eq(adminAuditLogs.entityType, 'refund'), eq(adminAuditLogs.entityId, id), eq(adminAuditLogs.action, 'refund_large_requested')))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(1);

    const requesterId = requestedLog[0]?.actorId || null;
    if (requesterId && requesterId === user.id) {
      return NextResponse.json({ error: 'Second-person approval required' }, { status: 409 });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'refund_large_approved',
      entityType: 'refund',
      entityId: id,
      message: 'Refund mare aprobat (a 2-a persoană)',
      meta: { orderId: refund.orderId, amount: Number(refund.amount) },
    });

    await logOrderAction({
      orderId: refund.orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'refund',
      meta: { refundId: id, approved: true, secondPerson: true },
    });

    const amount = Number(refund.amount);
    const result = await processRefund(id, refund.orderId, amount, 'RON');

    await logWebhook({
      source: 'refunds',
      ref: refund.orderId,
      payload: { action: 'approve_refund', refundId: id, amount },
      result: result.success ? 'ok' : 'error',
    });

    return NextResponse.json({
      ok: true,
      refundId: id,
      status: result.status,
      providerRef: result.providerRef,
      failureReason: result.failureReason,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
