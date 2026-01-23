import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const actorId = (url.searchParams.get('actorId') || '').trim();
    const action = (url.searchParams.get('action') || '').trim();
    const entityType = (url.searchParams.get('entityType') || '').trim();
    const entityId = (url.searchParams.get('entityId') || '').trim();
    const from = (url.searchParams.get('from') || '').trim();
    const to = (url.searchParams.get('to') || '').trim();

    const page = clampInt(url.searchParams.get('page'), 1, 1, 10_000);
    const pageSize = clampInt(url.searchParams.get('pageSize'), 50, 1, 200);
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (actorId) conditions.push(eq(adminAuditLogs.actorId, actorId));
    if (action) conditions.push(eq(adminAuditLogs.action, action));
    if (entityType) conditions.push(eq(adminAuditLogs.entityType, entityType));
    if (entityId) conditions.push(eq(adminAuditLogs.entityId, entityId));

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(adminAuditLogs.createdAt, d));
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(adminAuditLogs.createdAt, d));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(adminAuditLogs.action, search),
          ilike(adminAuditLogs.entityType, search),
          ilike(adminAuditLogs.entityId, search),
          ilike(adminAuditLogs.message, search),
          sql`${adminAuditLogs.meta}::text ILIKE ${search}`
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: adminAuditLogs.id,
          createdAt: adminAuditLogs.createdAt,
          actorId: adminAuditLogs.actorId,
          actorRole: adminAuditLogs.actorRole,
          action: adminAuditLogs.action,
          entityType: adminAuditLogs.entityType,
          entityId: adminAuditLogs.entityId,
          message: adminAuditLogs.message,
          meta: adminAuditLogs.meta,
          actorEmail: users.email,
        })
        .from(adminAuditLogs)
        .leftJoin(users, eq(adminAuditLogs.actorId, users.id))
        .where(where)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminAuditLogs)
        .where(where),
    ]);

    const total = Number(totalRows?.[0]?.count ?? 0);

    return NextResponse.json({
      page,
      pageSize,
      total,
      rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
