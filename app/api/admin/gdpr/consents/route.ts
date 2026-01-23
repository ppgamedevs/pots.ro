import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprConsentEvents, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { hashEmailSha256 } from '@/lib/compliance/gdpr';
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
    const email = (url.searchParams.get('email') || '').trim();
    const q = (url.searchParams.get('q') || '').trim();
    const consentType = (url.searchParams.get('consentType') || '').trim();
    const source = (url.searchParams.get('source') || '').trim();
    const from = (url.searchParams.get('from') || '').trim();
    const to = (url.searchParams.get('to') || '').trim();

    const page = clampInt(url.searchParams.get('page'), 1, 1, 10_000);
    const pageSize = clampInt(url.searchParams.get('pageSize'), 50, 1, 200);
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (email) {
      const emailHash = hashEmailSha256(email);
      conditions.push(eq(gdprConsentEvents.emailHash, emailHash));
    }

    if (consentType === 'necessary' || consentType === 'all') {
      conditions.push(eq(gdprConsentEvents.consentType, consentType));
    }

    if (source === 'user' || source === 'admin' || source === 'migration') {
      conditions.push(eq(gdprConsentEvents.source, source));
    }

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(gdprConsentEvents.createdAt, d));
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(gdprConsentEvents.createdAt, d));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(gdprConsentEvents.emailDomain, search),
          ilike(gdprConsentEvents.emailMasked, search),
          ilike(gdprConsentEvents.policyVersion, search),
          ilike(gdprConsentEvents.legalBasis, search)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: gdprConsentEvents.id,
          createdAt: gdprConsentEvents.createdAt,
          emailHash: gdprConsentEvents.emailHash,
          emailDomain: gdprConsentEvents.emailDomain,
          emailMasked: gdprConsentEvents.emailMasked,
          consentType: gdprConsentEvents.consentType,
          legalBasis: gdprConsentEvents.legalBasis,
          source: gdprConsentEvents.source,
          actorId: gdprConsentEvents.actorId,
          actorEmail: users.email,
          ip: gdprConsentEvents.ip,
          userAgent: gdprConsentEvents.userAgent,
          policyVersion: gdprConsentEvents.policyVersion,
        })
        .from(gdprConsentEvents)
        .leftJoin(users, eq(gdprConsentEvents.actorId, users.id))
        .where(where)
        .orderBy(desc(gdprConsentEvents.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(gdprConsentEvents)
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
