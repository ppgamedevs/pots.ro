import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const row = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (row.approvalStatus !== 'pending_approval') {
      return NextResponse.json({ error: 'Promotion not pending approval' }, { status: 409 });
    }

    if (!row.approvalRequestedBy) {
      return NextResponse.json({ error: 'Approval must be requested first' }, { status: 409 });
    }

    if (row.approvalRequestedBy === user.id) {
      return NextResponse.json({ error: 'Second-person review required' }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason ? String(body.reason).trim() : null;

    const [updated] = await db
      .update(promotions)
      .set({
        approvalStatus: 'rejected',
        approvedBy: user.id,
        approvedAt: new Date(),
        changeNote: reason ?? row.changeNote,
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_rejected',
      entityType: 'promotion',
      entityId: id,
      message: 'Promotion rejected (second person)',
      meta: { requestedBy: row.approvalRequestedBy, reason },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
