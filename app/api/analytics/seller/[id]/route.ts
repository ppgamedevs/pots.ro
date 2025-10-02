import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { sellerStatsDaily, productStatsDaily, sellers, products } from '@/db/schema/core';
import { eq, gte, lte, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// GET /api/analytics/seller/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const sellerId = params.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Verify seller access (seller can only see their own stats)
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, (session.user as any).id)
    });

    if (!seller || seller.id !== sellerId) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

    // Get daily stats series
    const dailyStats = await db
      .select()
      .from(sellerStatsDaily)
      .where(
        and(
          eq(sellerStatsDaily.sellerId, sellerId),
          gte(sellerStatsDaily.date, startDate),
          lte(sellerStatsDaily.date, endDate)
        )
      )
      .orderBy(sellerStatsDaily.date);

    // Get top products by revenue
    const topProducts = await db.execute(sql`
      SELECT 
        p.id as product_id,
        p.title as name,
        SUM(ps.revenue) as revenue
      FROM product_stats_daily ps
      JOIN products p ON p.id = ps.product_id
      WHERE ps.product_id IN (
        SELECT id FROM products WHERE seller_id = ${sellerId}
      )
        AND ps.date >= ${startDate}
        AND ps.date <= ${endDate}
      GROUP BY p.id, p.title
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // Calculate bounce metrics
    const bounceMetrics = await db.execute(sql`
      SELECT 
        SUM(views) as views,
        SUM(add_to_cart) as add_to_cart
      FROM seller_stats_daily
      WHERE seller_id = ${sellerId}
        AND date >= ${startDate}
        AND date <= ${endDate}
    `);

    const bounceData = bounceMetrics.rows[0] as any || { views: 0, add_to_cart: 0 };

    return NextResponse.json({
      range,
      series: dailyStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0],
        views: stat.views,
        addToCart: stat.addToCart,
        orders: stat.orders,
        revenue: stat.revenue
      })),
      topProducts: topProducts.rows.map((row: any) => ({
        productId: row.product_id,
        name: row.name,
        revenue: parseInt(row.revenue) || 0
      })),
      bounce: {
        views: parseInt(bounceData.views) || 0,
        addToCart: parseInt(bounceData.add_to_cart) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea statisticilor' },
      { status: 500 }
    );
  }
}
