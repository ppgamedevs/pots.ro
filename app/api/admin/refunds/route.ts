import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds } from '@/db/schema/core';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { mapRefundRowToUI } from '@/lib/types.finante';

export const dynamic = 'force-dynamic';

function parseDateParam(value: string, isEndOfDay: boolean): Date {
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (ymd.test(value)) {
    return new Date(`${value}T${isEndOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  }
  return new Date(value);
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const statusRaw = (searchParams.get('status') || '').trim();
    const orderId = (searchParams.get('orderId') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const conditions = [];

    if (statusRaw) {
      const normalized = statusRaw.toLowerCase();
      if (normalized !== 'all') {
        conditions.push(eq(refunds.status, normalized as any));
      }
    }

    if (orderId) {
      conditions.push(eq(refunds.orderId, orderId));
    }

    if (from) {
      const fromDate = parseDateParam(from, false);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(refunds.createdAt, fromDate));
      }
    }

    if (to) {
      const toDate = parseDateParam(to, true);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(refunds.createdAt, toDate));
      }
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [totalRow] = await db.select({ count: count() }).from(refunds).where(whereClause);
    const total = Number(totalRow?.count ?? 0);

    const rows = await db
      .select()
      .from(refunds)
      .where(whereClause)
      .orderBy(desc(refunds.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: rows.map(mapRefundRowToUI),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
