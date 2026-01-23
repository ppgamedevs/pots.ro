import { NextRequest, NextResponse } from 'next/server';
import { runPayout } from '@/lib/payouts/run';
import { logWebhook } from '@/lib/webhook-logging';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { adminAuditLogs, payouts, orders } from '@/db/schema/core';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { writeAdminAudit } from '@/lib/admin/audit';

/**
 * POST /api/payouts/run-batch?date=YYYY-MM-DD
 * Procesează toate payout-urile PENDING pentru o dată specifică (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Parametrul date este obligatoriu (format: YYYY-MM-DD)'
      }, { status: 400 });
    }

    // Validează formatul datei
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        error: 'Formatul datei trebuie să fie YYYY-MM-DD'
      }, { status: 400 });
    }

    console.log(`🔄 Procesez payout-uri batch pentru data ${date}`);

    // Log webhook incoming
    await logWebhook({
      source: 'payouts',
      ref: 'batch',
      payload: { date, action: 'run-batch' },
      result: 'ok'
    });

    const targetDate = new Date(date);

    const pending = await db.query.payouts.findMany({
      where: and(eq(payouts.status, 'pending'), lte(orders.deliveredAt, targetDate)),
      with: { order: true },
    });

    const payoutIds = pending.map((p: any) => p.id);
    const approvedIds = new Set<string>();

    if (payoutIds.length) {
      const approved = await db
        .select({ entityId: adminAuditLogs.entityId })
        .from(adminAuditLogs)
        .where(and(eq(adminAuditLogs.entityType, 'payout'), eq(adminAuditLogs.action, 'payout_approved'), inArray(adminAuditLogs.entityId, payoutIds)));

      for (const row of approved as any[]) {
        approvedIds.add((row as any).entityId);
      }
    }

    const approvedPending = pending.filter((p: any) => approvedIds.has(p.id));

    const results: Array<{ success: boolean; payoutId: string; status: string; providerRef?: string; failureReason?: string }> = [];
    let successful = 0;
    let failed = 0;

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payout_batch_run_started',
      entityType: 'payout_batch',
      entityId: date,
      message: 'Batch payout run started (approved-only)',
      meta: { date, pending: pending.length, approved: approvedPending.length },
    });

    for (const p of approvedPending) {
      try {
        const r = await runPayout(p.id);
        results.push({
          success: r.success,
          payoutId: r.payoutId,
          status: r.status,
          providerRef: r.providerRef,
          failureReason: r.failureReason,
        });
        if (r.success) successful++; else failed++;
      } catch (e: any) {
        failed++;
        results.push({ success: false, payoutId: p.id, status: 'failed', failureReason: e?.message || 'Unknown error' });
      }
    }

    const result = {
      processed: approvedPending.length,
      successful,
      failed,
      results,
      skippedNotApproved: pending.length - approvedPending.length,
    };

    // Log webhook outgoing
    await logWebhook({
      source: 'payouts',
      ref: 'batch',
      payload: result,
      result: 'ok'
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      results: result.results,
      skippedNotApproved: (result as any).skippedNotApproved
    });
  } catch (error) {
    console.error('Eroare la procesarea batch payout:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    const status = errorMessage === 'Unauthorized' ? 401 : errorMessage === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: errorMessage }, { status });
  }
}
