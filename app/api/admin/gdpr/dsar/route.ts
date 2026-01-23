import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprDsrRequests, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { normalizeEmail } from '@/lib/auth/crypto';
import { hashEmailSha256 } from '@/lib/compliance/gdpr';
import { and, desc, eq, sql } from 'drizzle-orm';

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
    const status = (url.searchParams.get('status') || '').trim();

    const page = clampInt(url.searchParams.get('page'), 1, 1, 10_000);
    const pageSize = clampInt(url.searchParams.get('pageSize'), 50, 1, 200);
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (email) {
      const emailHash = hashEmailSha256(normalizeEmail(email));
      conditions.push(eq(gdprDsrRequests.emailHash, emailHash));
    }

    if (
      status === 'pending_verification' ||
      status === 'open' ||
      status === 'in_progress' ||
      status === 'fulfilled' ||
      status === 'rejected' ||
      status === 'cancelled'
    ) {
      conditions.push(eq(gdprDsrRequests.status, status));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: gdprDsrRequests.id,
          type: gdprDsrRequests.type,
          status: gdprDsrRequests.status,
          emailHash: gdprDsrRequests.emailHash,
          emailDomain: gdprDsrRequests.emailDomain,
          emailMasked: gdprDsrRequests.emailMasked,
          requestedAt: gdprDsrRequests.requestedAt,
          verifiedAt: gdprDsrRequests.verifiedAt,
          dueAt: gdprDsrRequests.dueAt,
          completedAt: gdprDsrRequests.completedAt,
          handledBy: gdprDsrRequests.handledBy,
          handledByEmail: users.email,
          notes: gdprDsrRequests.notes,
          meta: gdprDsrRequests.meta,
        })
        .from(gdprDsrRequests)
        .leftJoin(users, eq(gdprDsrRequests.handledBy, users.id))
        .where(where)
        .orderBy(desc(gdprDsrRequests.requestedAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(gdprDsrRequests)
        .where(where),
    ]);

    const total = Number(totalRows?.[0]?.count ?? 0);

    return NextResponse.json({ page, pageSize, total, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
