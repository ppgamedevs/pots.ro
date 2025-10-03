/**
 * Sitemap dinamic pentru vânzători
 * Regenerare zilnică cu cache 15 min
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sellers } from '@/db/schema/core';

export async function GET(request: NextRequest) {
  try {
    // Cache pentru 15 minute
    const cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600';
    
    // Obține vânzătorii activi
    const activeSellers = await db.query.sellers.findMany({
      columns: {
        id: true,
        slug: true,
        brandName: true,
        updatedAt: true
      }
    });

    // Generează XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${activeSellers.map(seller => {
    const lastmod = new Date(seller.updatedAt).toISOString().split('T')[0];
    
    return `  <url>
    <loc>https://floristmarket.ro/s/${seller.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Sellers sitemap error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
