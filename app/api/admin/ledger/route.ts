import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ledger } from '@/db/schema/core';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { mapLedgerRowToUI } from '@/lib/types.finante';

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
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 200);
    const offset = (page - 1) * pageSize;

    const type = (searchParams.get('type') || '').trim().toLowerCase();
    const entityType = (searchParams.get('entityType') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const conditions: any[] = [];
    if (type) conditions.push(eq(ledger.type, type as any));
    if (entityType) conditions.push(eq(ledger.entityType, entityType as any));
    if (from) {
      const d = parseDateParam(from, false);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(ledger.createdAt, d));
    }
    if (to) {
      const d = parseDateParam(to, true);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(ledger.createdAt, d));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const [totalRow] = await db.select({ count: count() }).from(ledger).where(whereClause);
    const total = Number(totalRow?.count ?? 0);

    const rows = await db
      .select()
      .from(ledger)
      .where(whereClause)
      .orderBy(desc(ledger.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: rows.map(mapLedgerRowToUI),
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
