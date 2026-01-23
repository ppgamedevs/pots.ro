import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ledger, payouts } from '@/db/schema/core';
import { and, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logWebhook } from '@/lib/webhook-logging';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payouts/[id]/mark-paid
 * Manual exception path. Requires reason and is audited.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const providerRef = String(body?.providerRef || '').trim();
    const reason = String(body?.reason || '').trim();

    if (!reason || reason.length < 8) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
    if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (payout.status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 409 });
    }

    const paidAt = new Date();
    await db
      .update(payouts)
      .set({ status: 'paid', providerRef: providerRef || payout.providerRef, paidAt, failureReason: null })
      .where(eq(payouts.id, id));

    const existingLedger = await db.query.ledger.findFirst({
      where: and(eq(ledger.type, 'payout'), eq(ledger.entityType, 'payout'), eq(ledger.entityId, id)),
    });

    if (!existingLedger) {
      await db.insert(ledger).values({
        type: 'payout',
        entityId: id,
        entityType: 'payout',
        amount: `-${payout.amount}`,
        currency: payout.currency,
        meta: { sellerId: payout.sellerId, orderId: payout.orderId, providerRef: providerRef || payout.providerRef || null, manual: true },
      });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'payout_mark_paid_exception',
      entityType: 'payout',
      entityId: id,
      message: 'Payout marked as paid (manual exception)',
      meta: { payoutId: id, orderId: payout.orderId, amount: Number(payout.amount), currency: payout.currency, providerRef, reason },
    });

    await logWebhook({
      source: 'payouts',
      ref: id,
      payload: { action: 'mark_paid', payoutId: id, providerRef, reason },
      result: 'ok',
    });

    return NextResponse.json({ ok: true, payoutId: id, status: 'paid', providerRef: providerRef || payout.providerRef, paidAt: paidAt.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
