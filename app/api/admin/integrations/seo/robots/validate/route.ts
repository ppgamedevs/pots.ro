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

function hasLine(text: string, needle: string) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

/**
 * POST /api/admin/integrations/seo/robots/validate
 * Fetches robots.txt and performs basic checks without leaking any private URLs.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const limited = await isRateLimited(`seo-robots-validate-${user.id}`, 20, 3600);
    if (limited) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Max 20 per hour.' }, { status: 429 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://floristmarket.ro';
    const url = `${baseUrl}/robots.txt`;

    const res = await fetch(url, { headers: { 'User-Agent': 'FloristMarket-SEO-Robots-Validator/1.0' } });
    const body = await res.text();

    const problems: string[] = [];

    if (!res.ok) problems.push(`robots.txt fetch failed (${res.status})`);
    if (!hasLine(body, 'user-agent:')) problems.push('Missing User-agent directive');
    if (!hasLine(body, 'sitemap:')) problems.push('Missing Sitemap reference');

    // Defensive: ensure admin paths are disallowed.
    const mustDisallow = ['/admin', '/api/admin'];
    for (const p of mustDisallow) {
      if (!hasLine(body, `disallow: ${p}`)) problems.push(`Missing Disallow: ${p}`);
    }

    // Ensure sitemap reference points to public sitemap.
    const expectedSitemap = `${baseUrl}/sitemap.xml`;
    if (hasLine(body, 'sitemap:') && !hasLine(body, expectedSitemap)) {
      problems.push('Sitemap reference does not match expected public sitemap');
    }

    const ok = problems.length === 0;

    const now = new Date().toISOString();
    await db
      .insert(settings)
      .values({
        key: 'seo_last_robots_validate',
        value: now,
        description: 'Last robots.txt validation timestamp',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: now, updatedBy: user.id, updatedAt: new Date() },
      });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'seo_robots_validate',
      entityType: 'seo',
      entityId: 'robots',
      meta: { url, httpStatus: res.status, ok, problems },
    });

    return NextResponse.json({ ok: true, result: { url, httpStatus: res.status, ok, problems } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
