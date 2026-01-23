import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, payouts, sellers } from '@/db/schema/core';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

function escapeCSV(v: any) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[\n\r",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseDateParam(value: string, isEndOfDay: boolean): Date {
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (ymd.test(value)) {
    return new Date(`${value}T${isEndOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  }
  return new Date(value);
}

/**
 * GET /api/admin/payouts/export
 * Banking export (CSV) with IBAN + beneficiary.
 * Defaults to status=pending and approvedOnly=true.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);
    const statusRaw = (searchParams.get('status') || 'pending').trim().toLowerCase();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();
    const approvedOnly = (searchParams.get('approvedOnly') || 'true').trim().toLowerCase() !== 'false';

    const conditions: any[] = [];
    if (statusRaw && statusRaw !== 'all') {
      conditions.push(eq(payouts.status, statusRaw as any));
    }
    if (from) {
      const d = parseDateParam(from, false);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(payouts.createdAt, d));
    }
    if (to) {
      const d = parseDateParam(to, true);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(payouts.createdAt, d));
    }

    const rows = await db
      .select({
        payoutId: payouts.id,
        createdAt: payouts.createdAt,
        orderId: payouts.orderId,
        sellerId: payouts.sellerId,
        amount: payouts.amount,
        currency: payouts.currency,
        status: payouts.status,
        iban: sellers.iban,
        legalName: sellers.legalName,
        brandName: sellers.brandName,
        email: sellers.email,
      })
      .from(payouts)
      .leftJoin(sellers, eq(payouts.sellerId, sellers.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(payouts.createdAt));

    let filtered = rows;
    if (approvedOnly && rows.length) {
      const payoutIds = rows.map((r: any) => r.payoutId);
      const approved = await db
        .select({ entityId: adminAuditLogs.entityId })
        .from(adminAuditLogs)
        .where(and(eq(adminAuditLogs.entityType, 'payout'), eq(adminAuditLogs.action, 'payout_approved'), inArray(adminAuditLogs.entityId, payoutIds)));
      const approvedSet = new Set(approved.map((r: any) => r.entityId));
      filtered = rows.filter((r: any) => approvedSet.has(r.payoutId));
    }

    const headers = ['payout_id', 'created_at', 'seller_id', 'beneficiary', 'iban', 'amount', 'currency', 'order_id', 'status', 'seller_email'];
    const csv = [
      headers.join(','),
      ...filtered.map((r: any) => {
        const beneficiary = r.legalName || r.brandName || '';
        return [
          escapeCSV(r.payoutId),
          escapeCSV(r.createdAt?.toISOString?.() || String(r.createdAt)),
          escapeCSV(r.sellerId),
          escapeCSV(beneficiary),
          escapeCSV(r.iban || ''),
          escapeCSV(r.amount),
          escapeCSV(r.currency),
          escapeCSV(r.orderId),
          escapeCSV(r.status),
          escapeCSV(r.email || ''),
        ].join(',');
      }),
    ].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payouts_banking_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
