import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema/core';
import { and, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';

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
    await requireRole(req, ['admin', 'support']);

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const status = (searchParams.get('status') || '').trim();
    const q = (searchParams.get('q') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const conditions: any[] = [];

    if (status) {
      const normalized = status.toLowerCase();
      if (normalized !== 'all') {
        conditions.push(eq(orders.status, normalized as any));
      }
    }

    if (q) {
      // Search by orderNumber, orderId, or paymentRef
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${q}%`),
          ilike(orders.id, `%${q}%`),
          ilike(orders.paymentRef, `%${q}%`)
        )
      );
    }

    if (from) {
      const fromDate = parseDateParam(from, false);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(orders.createdAt, fromDate));
      }
    }

    if (to) {
      const toDate = parseDateParam(to, true);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(orders.createdAt, toDate));
      }
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [totalRow] = await db.select({ count: count() }).from(orders).where(whereClause);
    const total = Number(totalRow?.count ?? 0);

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        currency: orders.currency,
        totalCents: orders.totalCents,
        paymentRef: orders.paymentRef,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({ data: rows, total, page, pageSize, provider: 'netopia' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
