import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema/core";
import { eq } from "drizzle-orm";

// Simple in-memory cache for serverless lifetime
const sitemapCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'sitemap-products';
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
    
    // Get all active products
    const productsResult = await db
      .select({
        id: products.id,
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.status, 'active'));

    // Helper function to escape XML special characters
    function escapeXml(unsafe: string): string {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    const urls = productsResult.map((product: any) => ({
      loc: `${baseUrl}/p/${product.id}-${product.slug}`,
      lastmod: product.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: '0.8',
    }));

    // Generate XML sitemap - ensure at least one URL (Google requires it)
    // If no products, include homepage as placeholder
    const urlEntries = urls.length > 0 
      ? urls.map((url: any) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')
      : `  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

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
    console.error('Products sitemap error:', error);
    return new NextResponse('Error generating products sitemap', { status: 500 });
  }
}
