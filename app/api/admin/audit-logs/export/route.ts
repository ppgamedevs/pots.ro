import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { writeAdminAudit } from '@/lib/admin/audit';
import { getClientIP, getUserAgent } from '@/lib/auth/crypto';

export const dynamic = 'force-dynamic';

function csvEscape(value: any) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const actorId = (url.searchParams.get('actorId') || '').trim();
    const action = (url.searchParams.get('action') || '').trim();
    const entityType = (url.searchParams.get('entityType') || '').trim();
    const entityId = (url.searchParams.get('entityId') || '').trim();
    const from = (url.searchParams.get('from') || '').trim();
    const to = (url.searchParams.get('to') || '').trim();

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

    const rows = await db
      .select({
        createdAt: adminAuditLogs.createdAt,
        actorId: adminAuditLogs.actorId,
        actorEmail: users.email,
        actorRole: adminAuditLogs.actorRole,
        action: adminAuditLogs.action,
        entityType: adminAuditLogs.entityType,
        entityId: adminAuditLogs.entityId,
        message: adminAuditLogs.message,
        meta: adminAuditLogs.meta,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(5000);

    const header = [
      'createdAt',
      'actorId',
      'actorEmail',
      'actorRole',
      'action',
      'entityType',
      'entityId',
      'message',
      'meta',
    ].join(',');

    const lines = [header];
    for (const r of rows as any[]) {
      lines.push(
        [
          r.createdAt?.toISOString?.() ?? String(r.createdAt),
          r.actorId,
          r.actorEmail,
          r.actorRole,
          r.action,
          r.entityType,
          r.entityId,
          r.message,
          r.meta ? JSON.stringify(r.meta) : '',
        ].map(csvEscape).join(',')
      );
    }

    const ip = getClientIP(req.headers);
    const ua = getUserAgent(req.headers);
    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'audit.export',
      entityType: 'admin_audit_logs',
      entityId: 'export',
      message: 'Exported admin audit logs',
      meta: { ip, ua, q, actorId, action, entityType, entityId, from, to, rowCount: rows.length },
    });

    const csv = lines.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="admin_audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
