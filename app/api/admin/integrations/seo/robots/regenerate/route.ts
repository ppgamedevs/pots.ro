import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { settings, rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(eq(rateLimits.key, key));

  if (!existing || now > existing.resetAt) {
    await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }

  if (existing.count >= maxRequests) return true;

  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

/**
 * POST /api/admin/integrations/seo/robots/regenerate
 * Warms /robots.txt and stores a last-run timestamp.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const limited = await isRateLimited(`seo-robots-regenerate-${user.id}`, 10, 3600);
    if (limited) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Max 10 per hour.' }, { status: 429 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://floristmarket.ro';
    const url = `${baseUrl}/robots.txt`;

    let status: number | null = null;
    let ok = false;
    let error: string | null = null;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'FloristMarket-SEO-Robots-Regenerator/1.0' },
      });
      status = res.status;
      ok = res.ok;
      await res.text();
    } catch (e) {
      ok = false;
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    const now = new Date().toISOString();
    await db
      .insert(settings)
      .values({
        key: 'seo_last_robots_regen',
        value: now,
        description: 'Last robots.txt regeneration timestamp',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: now, updatedBy: user.id, updatedAt: new Date() },
      });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'seo_robots_regenerate',
      entityType: 'seo',
      entityId: 'robots',
      meta: { url, ok, status, error },
    });

    return NextResponse.json({ ok: true, regeneratedAt: now, result: { url, ok, status, error } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
