import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema/core";

// Simple in-memory cache for serverless lifetime
const sitemapCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'sitemap-categories';
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
    
    // Get all categories
    const categoriesResult = await db
      .select({
        slug: categories.slug,
        updatedAt: categories.updatedAt,
      })
      .from(categories);

    // Helper function to escape XML special characters
    function escapeXml(unsafe: string): string {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    const urls = categoriesResult.map((category: any) => ({
      loc: `${baseUrl}/c/${category.slug}`,
      lastmod: category.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.6',
    }));

    // Generate XML sitemap - ensure valid XML even if no categories
    const urlEntries = urls.length > 0 
      ? urls.map((url: any) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')
      : '  <!-- No categories available -->';

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
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
    console.error('Categories sitemap error:', error);
    return new NextResponse('Error generating categories sitemap', { status: 500 });
  }
}
