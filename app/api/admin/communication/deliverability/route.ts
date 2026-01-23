import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { emailDeliverabilityEvents, emailSuppressions } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { and, gte, isNull, sql } from 'drizzle-orm';

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
    const windowDays = clampInt(url.searchParams.get('windowDays'), 14, 1, 90);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [byType, daily, suppressionCounts] = await Promise.all([
      db
        .select({
          eventType: emailDeliverabilityEvents.eventType,
          count: sql<number>`count(*)`,
        })
        .from(emailDeliverabilityEvents)
        .where(gte(emailDeliverabilityEvents.occurredAt, since))
        .groupBy(emailDeliverabilityEvents.eventType),
      db.execute(sql`
        SELECT
          date_trunc('day', occurred_at) as day,
          event_type,
          count(*)::int as count
        FROM email_deliverability_events
        WHERE occurred_at >= ${since}
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `),
      db
        .select({
          active: sql<number>`sum(case when revoked_at is null then 1 else 0 end)`,
          total: sql<number>`count(*)`,
        })
        .from(emailSuppressions),
    ]);

    const counts: Record<string, number> = {};
    for (const row of byType as any[]) counts[String(row.eventType)] = Number(row.count ?? 0);

    const delivered = counts.delivered ?? 0;
    const bounced = counts.bounced ?? 0;
    const complained = counts.complained ?? 0;
    const failed = counts.failed ?? 0;

    const attempted = delivered + bounced + complained + failed;
    const bounceRate = attempted ? bounced / attempted : 0;
    const complaintRate = attempted ? complained / attempted : 0;

    return NextResponse.json({
      windowDays,
      since: since.toISOString(),
      counts,
      rates: {
        attempted,
        bounceRate,
        complaintRate,
      },
      daily: (daily.rows as any[]).map((r) => ({
        day: new Date(r.day).toISOString().slice(0, 10),
        eventType: r.event_type,
        count: Number(r.count ?? 0),
      })),
      suppressions: {
        active: Number((suppressionCounts as any)?.[0]?.active ?? 0),
        total: Number((suppressionCounts as any)?.[0]?.total ?? 0),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
