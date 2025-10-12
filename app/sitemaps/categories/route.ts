/**
 * Sitemap dinamic pentru categorii
 * Regenerare zilnică cu cache 15 min
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Cache pentru 15 minute
    const cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600';
    
    // Mock data pentru MVP - înlocuiește cu query real când baza de date este gata
    const mockCategories = [
      { id: '1', slug: 'ghivece', name: 'Ghivece', updatedAt: new Date() },
      { id: '2', slug: 'cutii', name: 'Cutii', updatedAt: new Date() },
      { id: '3', slug: 'ambalaje', name: 'Ambalaje', updatedAt: new Date() },
      { id: '4', slug: 'accesorii', name: 'Accesorii', updatedAt: new Date() },
    ];

    // Generează XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${mockCategories.map(category => {
    const lastmod = new Date(category.updatedAt).toISOString().split('T')[0];
    
    return `  <url>
    <loc>https://floristmarket.ro/c/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
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
