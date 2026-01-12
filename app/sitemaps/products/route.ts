/**
 * Sitemap dinamic pentru produse
 * Regenerare zilnică cu cache 15 min
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Cache pentru 15 minute
    const cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600';
    
    // Mock data pentru MVP - înlocuiește cu query real când baza de date este gata
    const mockProducts = [
      { id: '1', title: 'Ghiveci Ceramic Alb', updatedAt: new Date(), status: 'active' },
      { id: '2', title: 'Cutie Inalta Nevopsita', updatedAt: new Date(), status: 'active' },
      { id: '3', title: 'Panglica Satin', updatedAt: new Date(), status: 'active' },
    ];

    // Generează XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${mockProducts.map(product => {
    const slug = product.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const priority = product.status === 'active' ? '0.8' : '0.6';
    const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
    
    return `  <url>
    <loc>https://floristmarket.ro/p/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
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
    console.error('Products sitemap error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
