import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellers } from "@/db/schema/core";

// Simple in-memory cache for serverless lifetime
const sitemapCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'sitemap-sellers';
    const cached = sitemapCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new NextResponse(cached.content, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 's-maxage=900, stale-while-revalidate=60',
        },
      });
    }

    const baseUrl = process.env.APP_BASE_URL || 'https://floristmarket.ro';
    
    // Get all sellers
    const sellersResult = await db
      .select({
        slug: sellers.slug,
        updatedAt: sellers.updatedAt,
      })
      .from(sellers);

    const urls = sellersResult.map((seller: any) => ({
      loc: `${baseUrl}/s/${seller.slug}`,
      lastmod: seller.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: '0.7',
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url: any) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Cache the result
    sitemapCache.set(cacheKey, {
      content: sitemap,
      timestamp: Date.now(),
    });

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=900, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Sellers sitemap error:', error);
    return new NextResponse('Error generating sellers sitemap', { status: 500 });
  }
}
