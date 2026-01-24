/**
 * Cron job pentru regenerarea sitemap-urilor
 * Rulează zilnic la 2:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Verifică dacă este un cron job valid
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting sitemap regeneration...');

    // Regenerare sitemap-uri prin revalidare (canonical *.xml routes)
    const sitemapUrls = [
      '/sitemaps/products.xml',
      '/sitemaps/sellers.xml', 
      '/sitemaps/categories.xml',
      '/sitemaps/blog.xml',
      '/sitemap.xml'
    ];

    const results = [];

    for (const url of sitemapUrls) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro'}${url}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          results.push({ url, status: 'success' });
          console.log(`✅ Regenerated sitemap: ${url}`);
        } else {
          results.push({ url, status: 'error', error: `HTTP ${response.status}` });
          console.error(`❌ Failed to regenerate sitemap: ${url} - HTTP ${response.status}`);
        }
      } catch (error) {
        results.push({ url, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        console.error(`❌ Error regenerating sitemap: ${url}`, error);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Sitemap regeneration completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      ok: true,
      message: 'Sitemap regeneration completed',
      results: {
        successCount,
        errorCount,
        details: results
      }
    });
  } catch (error) {
    console.error('Sitemap regeneration cron error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
