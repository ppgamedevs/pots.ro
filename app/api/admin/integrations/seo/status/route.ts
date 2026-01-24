import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { settings, products, categories, sellers } from '@/db/schema/core';
import { eq, and, count, sql } from 'drizzle-orm';

/**
 * SEO Status API
 * Returns sitemap/robots status, last run metadata, and URL counts
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro';

    // 1. Get last regeneration timestamp from settings
    let lastRegenAt: string | null = null;
    try {
      const [regenRow] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, 'seo_last_sitemap_regen'))
        .limit(1);
      lastRegenAt = regenRow?.value ?? null;
    } catch {
      // Setting might not exist
    }

    // 2. Get URL counts for each sitemap type
    const [productsCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.status, 'active'));

    const [categoriesCount] = await db
      .select({ count: count() })
      .from(categories);

    const [sellersCount] = await db
      .select({ count: count() })
      .from(sellers)
      .where(eq(sellers.status, 'active'));

    // 3. Sitemap endpoints
    const sitemapEndpoints = [
      {
        name: 'Main Sitemap Index',
        path: '/sitemap.xml',
        fullUrl: `${baseUrl}/sitemap.xml`,
        type: 'index',
      },
      {
        name: 'Products Sitemap',
        path: '/sitemaps/products.xml',
        fullUrl: `${baseUrl}/sitemaps/products.xml`,
        type: 'urlset',
        urlCount: Number(productsCount?.count ?? 0),
      },
      {
        name: 'Categories Sitemap',
        path: '/sitemaps/categories.xml',
        fullUrl: `${baseUrl}/sitemaps/categories.xml`,
        type: 'urlset',
        urlCount: Number(categoriesCount?.count ?? 0),
      },
      {
        name: 'Sellers Sitemap',
        path: '/sitemaps/sellers.xml',
        fullUrl: `${baseUrl}/sitemaps/sellers.xml`,
        type: 'urlset',
        urlCount: Number(sellersCount?.count ?? 0),
      },
      {
        name: 'Blog Sitemap',
        path: '/sitemaps/blog.xml',
        fullUrl: `${baseUrl}/sitemaps/blog.xml`,
        type: 'urlset',
        urlCount: null, // Would need blog table
      },
    ];

    // 4. Robots.txt info
    const robotsInfo = {
      path: '/robots.txt',
      fullUrl: `${baseUrl}/robots.txt`,
      sitemapReference: `${baseUrl}/sitemap.xml`,
      note: 'Generated dynamically by Next.js metadata API',
    };

    // 5. Get last ping timestamp
    let lastPingAt: string | null = null;
    try {
      const [pingRow] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, 'seo_last_ping'))
        .limit(1);
      lastPingAt = pingRow?.value ?? null;
    } catch {
      // Setting might not exist
    }

    return NextResponse.json({
      ok: true,
      status: {
        baseUrl,
        lastRegenAt,
        lastPingAt,
        sitemapEndpoints,
        robotsInfo,
        summary: {
          totalUrls:
            Number(productsCount?.count ?? 0) +
            Number(categoriesCount?.count ?? 0) +
            Number(sellersCount?.count ?? 0),
          products: Number(productsCount?.count ?? 0),
          categories: Number(categoriesCount?.count ?? 0),
          sellers: Number(sellersCount?.count ?? 0),
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
