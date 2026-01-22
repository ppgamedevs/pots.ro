import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { and, count, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { redactWebhookPayload } from '@/lib/webhook-logging';

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

    const source = (searchParams.get('source') || '').trim();
    const result = (searchParams.get('result') || '').trim();
    const ref = (searchParams.get('ref') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const conditions: any[] = [];
    if (source) conditions.push(eq(webhookLogs.source, source as any));
    if (result) conditions.push(eq(webhookLogs.result, result as any));
    if (ref) conditions.push(ilike(webhookLogs.ref, `%${ref}%`));
    if (from) {
      const d = parseDateParam(from, false);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(webhookLogs.createdAt, d));
    }
    if (to) {
      const d = parseDateParam(to, true);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(webhookLogs.createdAt, d));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const [totalRow] = await db.select({ count: count() }).from(webhookLogs).where(whereClause);
    const total = Number(totalRow?.count ?? 0);

    const rows = await db
      .select()
      .from(webhookLogs)
      .where(whereClause)
      .orderBy(desc(webhookLogs.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data = rows.map((r: any) => ({
      ...r,
      payload: redactWebhookPayload(r.payload),
    }));

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
