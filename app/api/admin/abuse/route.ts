import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { authAudit } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { maskEmail } from '@/lib/security/pii';
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';

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
    const windowHours = clampInt(url.searchParams.get('windowHours'), 24, 1, 24 * 30);
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const baseWhere = and(eq(authAudit.kind, 'rate_limit'), gte(authAudit.createdAt, since));

    const [topIps, topEmails, totals] = await Promise.all([
      db
        .select({
          ip: authAudit.ip,
          count: sql<number>`count(*)`,
          lastSeen: sql<Date>`max(created_at)`
        })
        .from(authAudit)
        .where(and(baseWhere, isNotNull(authAudit.ip)))
        .groupBy(authAudit.ip)
        .orderBy(desc(sql`count(*)`))
        .limit(50),
      db
        .select({
          email: authAudit.email,
          domain: sql<string>`split_part(email, '@', 2)`,
          count: sql<number>`count(*)`,
          sampleId: sql<string>`min(id)::text`,
          lastSeen: sql<Date>`max(created_at)`
        })
        .from(authAudit)
        .where(and(baseWhere, isNotNull(authAudit.email)))
        .groupBy(authAudit.email)
        .orderBy(desc(sql`count(*)`))
        .limit(50),
      db
        .select({ total: sql<number>`count(*)` })
        .from(authAudit)
        .where(baseWhere),
    ]);

    return NextResponse.json({
      windowHours,
      since: since.toISOString(),
      total: Number(totals?.[0]?.total ?? 0),
      topIps: (topIps as any[]).map((r) => ({
        ip: r.ip,
        count: Number(r.count ?? 0),
        lastSeen: r.lastSeen ? new Date(r.lastSeen).toISOString() : null,
      })),
      topEmails: (topEmails as any[]).map((r) => ({
        emailMasked: r.email ? maskEmail(String(r.email)) : null,
        domain: r.domain ?? null,
        count: Number(r.count ?? 0),
        sampleId: r.sampleId,
        lastSeen: r.lastSeen ? new Date(r.lastSeen).toISOString() : null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
