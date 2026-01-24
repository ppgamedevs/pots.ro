import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { affiliatePartners } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const existing = await db.query.affiliatePartners.findFirst({ where: eq(affiliatePartners.id, id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const patch: any = {};

    if (body.name != null) patch.name = String(body.name).trim();
    if (body.status != null) patch.status = String(body.status).trim();
    if (body.contactEmail !== undefined) patch.contactEmail = body.contactEmail ? String(body.contactEmail).trim() : null;
    if (body.websiteUrl !== undefined) patch.websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;
    if (body.defaultCommissionBps !== undefined) patch.defaultCommissionBps = Math.trunc(Number(body.defaultCommissionBps));
    if (body.payoutNotes !== undefined) patch.payoutNotes = body.payoutNotes ? String(body.payoutNotes).trim() : null;

    if (patch.status && patch.status !== 'active' && patch.status !== 'disabled') {
      return NextResponse.json({ error: 'status must be active|disabled' }, { status: 400 });
    }
    if (patch.defaultCommissionBps !== undefined) {
      if (!Number.isFinite(patch.defaultCommissionBps) || patch.defaultCommissionBps < 0 || patch.defaultCommissionBps > 10000) {
        return NextResponse.json({ error: 'defaultCommissionBps must be 0..10000' }, { status: 400 });
      }
    }

    const [row] = await db
      .update(affiliatePartners)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(affiliatePartners.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'affiliate_partner_updated',
      entityType: 'affiliate_partner',
      entityId: id,
      message: 'Affiliate partner updated',
      meta: { patch },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const [row] = await db
      .update(affiliatePartners)
      .set({ status: 'disabled', updatedAt: new Date() })
      .where(eq(affiliatePartners.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'affiliate_partner_disabled',
      entityType: 'affiliate_partner',
      entityId: id,
      message: 'Affiliate partner disabled',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
