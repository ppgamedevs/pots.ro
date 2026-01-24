import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { products, categories, sellers, rateLimits } from '@/db/schema/core';
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

// Public-only URL patterns (allowlist to avoid leaking private URLs)
const PUBLIC_PATH_PATTERNS = ['/p/', '/c/', '/s/', '/blog/', '/ajutor/', '/about', '/contact'];

/**
 * SEO Validate API
 * Sample-checks URLs from sitemaps for validity (status codes, canonical tags, robots)
 * Never outputs private/admin/user-specific URLs
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 10 validations per hour
    const rateLimitKey = `seo-validate-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 10, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Max 10 validations per hour.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const sampleSize = Math.min(body.sampleSize || 10, 20);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro';

    // Get sample URLs from each category (public only)
    const [sampleProducts] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(sql`RANDOM()`)
      .limit(sampleSize);

    const [sampleCategories] = await db
      .select({ slug: categories.slug })
      .from(categories)
      .orderBy(sql`RANDOM()`)
      .limit(Math.ceil(sampleSize / 2));

    const [sampleSellers] = await db
      .select({ slug: sellers.slug })
      .from(sellers)
      .where(eq(sellers.status, 'active'))
      .orderBy(sql`RANDOM()`)
      .limit(Math.ceil(sampleSize / 2));

    // Build sample URLs (public only)
    const urlsToCheck: Array<{ type: string; path: string; fullUrl: string }> = [];

    if (sampleProducts) {
      urlsToCheck.push({
        type: 'product',
        path: `/p/${sampleProducts.slug}`,
        fullUrl: `${baseUrl}/p/${sampleProducts.slug}`,
      });
    }

    if (sampleCategories) {
      urlsToCheck.push({
        type: 'category',
        path: `/c/${sampleCategories.slug}`,
        fullUrl: `${baseUrl}/c/${sampleCategories.slug}`,
      });
    }

    if (sampleSellers) {
      urlsToCheck.push({
        type: 'seller',
        path: `/s/${sampleSellers.slug}`,
        fullUrl: `${baseUrl}/s/${sampleSellers.slug}`,
      });
    }

    // Add some static pages
    const staticPages = ['/about', '/ajutor', '/blog', '/contact', '/termeni', '/confidentialitate'];
    for (const page of staticPages.slice(0, 3)) {
      urlsToCheck.push({
        type: 'static',
        path: page,
        fullUrl: `${baseUrl}${page}`,
      });
    }

    // Validate each URL
    const validationResults: Array<{
      type: string;
      path: string;
      status: number | null;
      ok: boolean;
      hasCanonical: boolean | null;
      robotsAllowed: boolean | null;
      error?: string;
    }> = [];

    for (const urlInfo of urlsToCheck) {
      try {
        const res = await fetch(urlInfo.fullUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'FloristMarket-SEO-Validator/1.0',
          },
          redirect: 'follow',
        });

        const html = await res.text();

        // Check for canonical tag
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
        const hasCanonical = !!canonicalMatch;

        // Check for robots meta (assume allowed if no noindex)
        const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
        const robotsContent = robotsMatch?.[1] || '';
        const robotsAllowed = !robotsContent.includes('noindex');

        validationResults.push({
          type: urlInfo.type,
          path: urlInfo.path,
          status: res.status,
          ok: res.ok,
          hasCanonical,
          robotsAllowed,
        });
      } catch (err) {
        validationResults.push({
          type: urlInfo.type,
          path: urlInfo.path,
          status: null,
          ok: false,
          hasCanonical: null,
          robotsAllowed: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'seo_url_validate',
      entityType: 'seo',
      entityId: 'urls',
      meta: {
        checkedCount: validationResults.length,
        passCount: validationResults.filter((r) => r.ok && r.hasCanonical && r.robotsAllowed).length,
        failCount: validationResults.filter((r) => !r.ok).length,
      },
    });

    // Summary
    const summary = {
      total: validationResults.length,
      passed: validationResults.filter((r) => r.ok && r.hasCanonical !== false && r.robotsAllowed !== false).length,
      failed: validationResults.filter((r) => !r.ok).length,
      missingCanonical: validationResults.filter((r) => r.hasCanonical === false).length,
      blockedByRobots: validationResults.filter((r) => r.robotsAllowed === false).length,
    };

    return NextResponse.json({
      ok: true,
      message: summary.failed === 0 ? 'All sampled URLs passed validation' : 'Some URLs have issues',
      summary,
      results: validationResults,
      note: 'Sample-based validation. Results may vary on subsequent runs.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
