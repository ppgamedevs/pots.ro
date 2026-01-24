import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { settings, rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';

// Simple rate limit helper using resetAt schema
async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(eq(rateLimits.key, key));
  
  if (!existing || now > existing.resetAt) {
    await db.insert(rateLimits).values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }
  
  if (existing.count >= maxRequests) return true;
  
  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

/**
 * SEO Ping API
 * Submits sitemap URLs to Google and Bing for indexing
 * Enforces global cooldown to prevent abuse
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 2 pings per day (global cooldown)
    const rateLimitKey = `seo-ping-global`;
    const limited = await isRateLimited(rateLimitKey, 2, 86400);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Global cooldown active. Max 2 pings per day to prevent search engine rate limiting.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { engines = ['google', 'bing'] } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl);

    // Ping endpoints
    const pingEndpoints: Record<string, string> = {
      google: `https://www.google.com/ping?sitemap=${encodedSitemapUrl}`,
      bing: `https://www.bing.com/ping?sitemap=${encodedSitemapUrl}`,
    };

    const results: Array<{
      engine: string;
      url: string;
      status: number | null;
      ok: boolean;
      error?: string;
    }> = [];

    // Ping each engine
    for (const engine of engines) {
      const pingUrl = pingEndpoints[engine];
      if (!pingUrl) {
        results.push({
          engine,
          url: '',
          status: null,
          ok: false,
          error: `Unknown engine: ${engine}`,
        });
        continue;
      }

      try {
        const res = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'FloristMarket-SEO-Ping/1.0',
          },
        });

        results.push({
          engine,
          url: pingUrl,
          status: res.status,
          ok: res.ok || res.status === 200,
        });
      } catch (err) {
        results.push({
          engine,
          url: pingUrl,
          status: null,
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Record ping timestamp
    const now = new Date().toISOString();
    await db
      .insert(settings)
      .values({
        key: 'seo_last_ping',
        value: now,
        description: 'Last sitemap ping to search engines',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: now,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });

    // Record ping details
    await db
      .insert(settings)
      .values({
        key: 'seo_last_ping_details',
        value: JSON.stringify({ engines, results: results.map((r) => ({ engine: r.engine, ok: r.ok })) }),
        description: 'Last sitemap ping details',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: JSON.stringify({ engines, results: results.map((r) => ({ engine: r.engine, ok: r.ok })) }),
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'seo_ping_search_engines',
      entityType: 'seo',
      entityId: 'sitemap',
      meta: {
        sitemapUrl,
        engines,
        results: results.map((r) => ({ engine: r.engine, ok: r.ok, status: r.status })),
      },
    });

    const allOk = results.every((r) => r.ok);

    return NextResponse.json({
      ok: true,
      message: allOk
        ? 'Sitemap ping sent to all search engines'
        : 'Sitemap ping completed with some failures',
      pingedAt: now,
      sitemapUrl,
      results,
      note: 'Search engines may take time to process the sitemap. Avoid pinging too frequently.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
