import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, payouts } from '@/db/schema/core';
import { and, desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { runPayout } from '@/lib/payouts/run';
import { logWebhook } from '@/lib/webhook-logging';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payouts/[id]/approve
 * Second-person approval + runs the payout (minimal).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
    if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (payout.status !== 'pending' && payout.status !== 'failed') {
      return NextResponse.json({ error: 'Payout not approvable in current status' }, { status: 409 });
    }

    const requestedLog = await db
      .select()
      .from(adminAuditLogs)
      .where(and(eq(adminAuditLogs.entityType, 'payout'), eq(adminAuditLogs.entityId, id), eq(adminAuditLogs.action, 'payout_approval_requested')))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(1);

    const requesterId = requestedLog[0]?.actorId || null;
    if (!requesterId) {
      return NextResponse.json({ error: 'Approval must be requested first' }, { status: 409 });
    }
    if (requesterId === user.id) {
      return NextResponse.json({ error: 'Second-person approval required' }, { status: 409 });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payout_approved',
      entityType: 'payout',
      entityId: id,
      message: 'Payout approved (second person)',
      meta: { payoutId: id, requesterId, orderId: payout.orderId, amount: Number(payout.amount), currency: payout.currency },
    });

    const result = await runPayout(id, { allowFailed: true });

    await logWebhook({
      source: 'payouts',
      ref: id,
      payload: { action: 'approve_and_run', payoutId: id, success: result.success, status: result.status, providerRef: result.providerRef },
      result: result.success ? 'ok' : 'error',
    });

    return NextResponse.json({
      ok: true,
      payoutId: id,
      status: result.status,
      success: result.success,
      providerRef: result.providerRef,
      failureReason: result.failureReason,
      paidAt: result.paidAt?.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
