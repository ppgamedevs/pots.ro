import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, orders, sellers, users } from '@/db/schema/core';
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

    const type = (searchParams.get('type') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const issuer = (searchParams.get('issuer') || '').trim();
    const orderId = (searchParams.get('orderId') || '').trim();
    const sellerId = (searchParams.get('sellerId') || '').trim();
    const q = (searchParams.get('q') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const conditions: any[] = [];

    if (type && type !== 'all') {
      conditions.push(eq(invoices.type, type as any));
    }

    if (status && status !== 'all') {
      conditions.push(eq(invoices.status, status as any));
    }

    if (issuer && issuer !== 'all') {
      conditions.push(eq(invoices.issuer, issuer as any));
    }

    if (orderId) {
      conditions.push(eq(invoices.orderId, orderId));
    }

    if (sellerId) {
      // Join with orders to filter by seller
      conditions.push(eq(orders.sellerId, sellerId));
    }

    if (q) {
      // Search by invoice series+number or order number
      conditions.push(
        or(
          ilike(invoices.series, `%${q}%`),
          ilike(invoices.number, `%${q}%`),
          ilike(orders.orderNumber, `%${q}%`)
        )
      );
    }

    if (from) {
      const fromDate = parseDateParam(from, false);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(invoices.createdAt, fromDate));
      }
    }

    if (to) {
      const toDate = parseDateParam(to, true);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(invoices.createdAt, toDate));
      }
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Count total
    const [totalRow] = await db
      .select({ count: count() })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .where(whereClause);
    const total = Number(totalRow?.count ?? 0);

    // Fetch with joins
    const rows = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        orderNumber: orders.orderNumber,
        type: invoices.type,
        series: invoices.series,
        number: invoices.number,
        pdfUrl: invoices.pdfUrl,
        total: invoices.total,
        currency: invoices.currency,
        issuer: invoices.issuer,
        status: invoices.status,
        errorMessage: invoices.errorMessage,
        voidedAt: invoices.voidedAt,
        voidReason: invoices.voidReason,
        sellerInvoiceNumber: invoices.sellerInvoiceNumber,
        sellerId: orders.sellerId,
        sellerName: sellers.brandName,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get summary stats
    const [stats] = await db
      .select({
        totalIssued: count(eq(invoices.status, 'issued')),
        totalVoided: count(eq(invoices.status, 'voided')),
        totalError: count(eq(invoices.status, 'error')),
      })
      .from(invoices);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        issued: Number(stats?.totalIssued ?? 0),
        voided: Number(stats?.totalVoided ?? 0),
        error: Number(stats?.totalError ?? 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
