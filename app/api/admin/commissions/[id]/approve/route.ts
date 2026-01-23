import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { commissionRates } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/commissions/[id]/approve
 * 2-person approval for commission changes.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const row = await db.query.commissionRates.findFirst({ where: eq(commissionRates.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (row.status !== 'pending') {
      return NextResponse.json({ error: 'Not pending' }, { status: 409 });
    }

    if (row.requestedBy && row.requestedBy === user.id) {
      return NextResponse.json({ error: 'Second-person approval required' }, { status: 409 });
    }

    const approvedAt = new Date();
    const [updated] = await db
      .update(commissionRates)
      .set({ status: 'approved', approvedBy: user.id, approvedAt })
      .where(eq(commissionRates.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'commission_change_approved',
      entityType: 'commission_rate',
      entityId: id,
      message: 'Commission change approved',
      meta: { sellerId: updated.sellerId || 'default', pctBps: updated.pctBps, effectiveAt: updated.effectiveAt?.toISOString?.() },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
