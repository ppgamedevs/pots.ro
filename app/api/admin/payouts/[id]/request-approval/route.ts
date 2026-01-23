import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payouts } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payouts/[id]/request-approval
 * First-person step for payouts. Records a request in admin_audit_logs.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
    if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (payout.status !== 'pending' && payout.status !== 'failed') {
      return NextResponse.json({ error: 'Payout not requestable in current status' }, { status: 409 });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payout_approval_requested',
      entityType: 'payout',
      entityId: id,
      message: 'Payout approval requested',
      meta: {
        payoutId: id,
        orderId: payout.orderId,
        sellerId: payout.sellerId,
        amount: Number(payout.amount),
        currency: payout.currency,
        status: payout.status,
      },
    });

    return NextResponse.json({ ok: true, payoutId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
