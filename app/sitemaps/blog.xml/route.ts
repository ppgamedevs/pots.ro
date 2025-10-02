import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for serverless lifetime
const sitemapCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'sitemap-blog';
    const cached = sitemapCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new NextResponse(cached.content, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 's-maxage=900, stale-while-revalidate=60',
        },
      });
    }

    const baseUrl = process.env.APP_BASE_URL || 'https://pots.ro';
    
    // For MVP, we'll include static blog pages
    // In a real implementation, you'd fetch blog posts from a CMS or database
    const blogPages = [
      {
        slug: 'about',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.5',
      },
      {
        slug: 'help',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.5',
      },
      {
        slug: 'faq',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.5',
      },
      {
        slug: 'contact',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.5',
      },
    ];

    const urls = blogPages.map(page => ({
      loc: `${baseUrl}/${page.slug}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
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
    console.error('Blog sitemap error:', error);
    return new NextResponse('Error generating blog sitemap', { status: 500 });
  }
}
