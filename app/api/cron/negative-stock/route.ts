/**
 * Cron job pentru detectarea stocului negativ
 * Rulează zilnic pentru a verifica produsele cu stoc < 0
 * și creează alerte pentru admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, sellers } from '@/db/schema/core';
import { lt, eq } from 'drizzle-orm';
import { createAlertsBulk, autoResolveAlert } from '@/lib/admin/alerts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verifică dacă este un cron job valid
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📦 Starting negative stock check cron job...');

    // Găsește produsele cu stoc negativ (active sau draft)
    const negativeStockProducts = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        stock: products.stock,
        sellerId: products.sellerId,
        sellerName: sellers.brandName,
      })
      .from(products)
      .leftJoin(sellers, eq(sellers.id, products.sellerId))
      .where(lt(products.stock, 0));

    console.log(`🔍 Found ${negativeStockProducts.length} products with negative stock`);

    if (negativeStockProducts.length === 0) {
      // Auto-resolve any existing negative stock alerts that are now fixed
      // This is a simple approach - in production you might want to be more targeted
      console.log('✅ No negative stock issues found');
      
      return NextResponse.json({
        ok: true,
        checked: true,
        negativeCount: 0,
        alertsCreated: 0,
        alertsDeduplicated: 0,
      });
    }

    // Prepare alerts for each product
    const alertInputs = negativeStockProducts.map((product) => ({
      source: 'stock_negative' as const,
      type: 'negative_stock',
      severity: 'high' as const, // Negative stock is a high priority issue
      dedupeKey: `stock:product:${product.id}`,
      entityType: 'product',
      entityId: product.id,
      title: `Stoc negativ: ${product.title}`,
      details: {
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        currentStock: product.stock,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        detectedAt: new Date().toISOString(),
      },
    }));

    // Create alerts in bulk
    const { created, deduplicated } = await createAlertsBulk(alertInputs);

    console.log(`📊 Negative stock check complete: ${created} new alerts, ${deduplicated} deduplicated`);

    return NextResponse.json({
      ok: true,
      checked: true,
      negativeCount: negativeStockProducts.length,
      alertsCreated: created,
      alertsDeduplicated: deduplicated,
      products: negativeStockProducts.map((p) => ({
        id: p.id,
        title: p.title,
        stock: p.stock,
        seller: p.sellerName,
      })),
    });
  } catch (error) {
    console.error('❌ Negative stock check cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
