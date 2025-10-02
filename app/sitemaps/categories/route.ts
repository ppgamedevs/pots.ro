/**
 * Sitemap dinamic pentru categorii
 * Regenerare zilnică cu cache 15 min
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/db/schema/core';

export async function GET(request: NextRequest) {
  try {
    // Cache pentru 15 minute
    const cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600';
    
    // Obține categoriile
    const allCategories = await db.query.categories.findMany({
      columns: {
        id: true,
        slug: true,
        name: true,
        updatedAt: true
      }
    });

    // Generează XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allCategories.map(category => {
    const lastmod = new Date(category.updatedAt).toISOString().split('T')[0];
    
    return `  <url>
    <loc>https://pots.ro/c/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
    console.error('Categories sitemap error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
