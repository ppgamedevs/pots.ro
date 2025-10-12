/**
 * Sitemap dinamic pentru vânzători
 * Regenerare zilnică cu cache 15 min
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Cache pentru 15 minute
    const cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600';
    
    // Mock data pentru MVP - înlocuiește cu query real când baza de date este gata
    const mockSellers = [
      { id: '1', slug: 'atelier-ceramic', brandName: 'Atelier Ceramic', updatedAt: new Date() },
      { id: '2', slug: 'cardboard-street', brandName: 'Cardboard Street', updatedAt: new Date() },
      { id: '3', slug: 'accesorii-florale', brandName: 'Accesorii Florale', updatedAt: new Date() },
    ];

    // Generează XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${mockSellers.map(seller => {
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
