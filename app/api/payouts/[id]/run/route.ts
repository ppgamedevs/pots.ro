import { NextRequest, NextResponse } from 'next/server';
import { runPayout } from '@/lib/payouts/run';
import { logWebhook } from '@/lib/webhook-logging';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { adminAuditLogs } from '@/db/schema/core';
import { and, desc, eq } from 'drizzle-orm';
import { writeAdminAudit } from '@/lib/admin/audit';

/**
 * POST /api/payouts/[id]/run
 * Procesează un payout individual (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ['admin']);
    const { id: payoutId } = await params;

    // Enforce separation-of-duties: payout must be approved (second-person)
    const approvedLog = await db
      .select()
      .from(adminAuditLogs)
      .where(and(eq(adminAuditLogs.entityType, 'payout'), eq(adminAuditLogs.entityId, payoutId), eq(adminAuditLogs.action, 'payout_approved')))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(1);

    if (!approvedLog[0]) {
      return NextResponse.json({ success: false, error: 'Payout not approved (requires 2-person approval)' }, { status: 409 });
    }

    console.log(`🔄 Procesez payout ${payoutId}`);

    // Log webhook incoming
    await logWebhook({
      source: 'payouts',
      ref: payoutId,
      payload: { payoutId, action: 'run' },
      result: 'ok'
    });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payout_run_started',
      entityType: 'payout',
      entityId: payoutId,
      message: 'Payout run started',
      meta: { via: '/api/payouts/[id]/run' },
    });

    const result = await runPayout(payoutId, { allowFailed: true });

    // Log webhook outgoing
    await logWebhook({
      source: 'payouts',
      ref: payoutId,
      payload: result,
      result: result.success ? 'ok' : 'error'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        payoutId: result.payoutId,
        status: result.status,
        providerRef: result.providerRef,
        paidAt: result.paidAt
      });
    } else {
      return NextResponse.json({
        success: false,
        payoutId: result.payoutId,
        status: result.status,
        failureReason: result.failureReason
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Eroare la procesarea payout:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    const status = errorMessage === 'Unauthorized' ? 401 : errorMessage === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: errorMessage }, { status });
  }
}
