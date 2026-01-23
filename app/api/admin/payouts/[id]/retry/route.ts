import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payouts } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payouts/[id]/retry
 * Minimal alias: retries a failed payout via the same approval flow.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, ['admin']);
    const { id } = await params;

    const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
    if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (payout.status !== 'failed') return NextResponse.json({ error: 'Only FAILED payouts can be retried' }, { status: 409 });

    return NextResponse.json({
      ok: false,
      error: 'Use /api/admin/payouts/[id]/approve after requesting approval (2-person) to retry a failed payout',
    }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
