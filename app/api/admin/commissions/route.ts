import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { commissionRates } from '@/db/schema/core';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'support']);
    const { searchParams } = new URL(req.url);
    const sellerId = (searchParams.get('sellerId') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const conditions: any[] = [];
    if (sellerId === 'default') conditions.push(isNull(commissionRates.sellerId));
    else if (sellerId) conditions.push(eq(commissionRates.sellerId, sellerId));
    if (status) conditions.push(eq(commissionRates.status, status as any));

    const rows = await db
      .select()
      .from(commissionRates)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(commissionRates.createdAt));

    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);
    const body = await req.json().catch(() => ({}));
    const pctBps = Number(body?.pctBps);
    const sellerIdRaw = String(body?.sellerId || '').trim();
    const sellerId = sellerIdRaw ? sellerIdRaw : null;
    const effectiveAtRaw = String(body?.effectiveAt || '').trim();
    const note = String(body?.note || '').trim();

    if (!Number.isFinite(pctBps) || pctBps <= 0 || pctBps > 10000) {
      return NextResponse.json({ error: 'pctBps must be between 1 and 10000' }, { status: 400 });
    }
    if (!effectiveAtRaw) {
      return NextResponse.json({ error: 'effectiveAt is required' }, { status: 400 });
    }
    const effectiveAt = new Date(effectiveAtRaw);
    if (Number.isNaN(effectiveAt.getTime())) {
      return NextResponse.json({ error: 'effectiveAt invalid date' }, { status: 400 });
    }

    const [row] = await db
      .insert(commissionRates)
      .values({
        sellerId,
        pctBps,
        effectiveAt,
        status: 'pending',
        requestedBy: user.id,
        note: note || null,
      })
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'commission_change_requested',
      entityType: 'commission_rate',
      entityId: row.id,
      message: 'Commission change requested',
      meta: { sellerId: sellerId || 'default', pctBps, effectiveAt: effectiveAt.toISOString(), note },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
