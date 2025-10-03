import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for serverless lifetime
const sitemapCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'sitemap-index';
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
    const sitemaps = [
      {
        loc: `${baseUrl}/sitemaps/products.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/sitemaps/sellers.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/sitemaps/categories.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/sitemaps/blog.xml`,
        lastmod: new Date().toISOString(),
      },
    ];

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    // Cache the result
    sitemapCache.set(cacheKey, {
      content: sitemapIndex,
      timestamp: Date.now(),
    });

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=900, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Sitemap index error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
