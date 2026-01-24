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
 * SEO Regenerate API
 * Triggers sitemap regeneration by warming the sitemap endpoints
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 5 regenerations per hour
    const rateLimitKey = `seo-regenerate-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 5, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Max 5 regenerations per hour.' },
        { status: 429 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://floristmarket.ro';

    // Sitemap endpoints to warm (the canonical *.xml routes)
    const sitemapEndpoints = [
      '/sitemaps/products.xml',
      '/sitemaps/categories.xml',
      '/sitemaps/sellers.xml',
      '/sitemaps/blog.xml',
      '/sitemap.xml',
    ];

    const results: Array<{ endpoint: string; status: number | null; ok: boolean; error?: string }> = [];

    // Warm each endpoint
    for (const endpoint of sitemapEndpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'User-Agent': 'FloristMarket-SEO-Regenerator/1.0',
          },
        });
        results.push({
          endpoint,
          status: res.status,
          ok: res.ok,
        });
      } catch (err) {
        results.push({
          endpoint,
          status: null,
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Record regeneration timestamp
    const now = new Date().toISOString();
    await db
      .insert(settings)
      .values({
        key: 'seo_last_sitemap_regen',
        value: now,
        description: 'Last sitemap regeneration timestamp',
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

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'seo_sitemap_regenerate',
      entityType: 'seo',
      entityId: 'sitemaps',
      meta: {
        results: results.map((r) => ({ endpoint: r.endpoint, ok: r.ok, status: r.status })),
        successCount: results.filter((r) => r.ok).length,
        failedCount: results.filter((r) => !r.ok).length,
      },
    });

    const allOk = results.every((r) => r.ok);

    return NextResponse.json({
      ok: true,
      message: allOk
        ? 'All sitemaps regenerated successfully'
        : 'Sitemaps regenerated with some failures',
      regeneratedAt: now,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
