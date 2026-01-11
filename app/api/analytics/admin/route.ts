import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { sellerStatsDaily, sellers, orders } from '@/db/schema/core';
import { eq, gte, desc, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/analytics/admin
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

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

    // Get marketplace overview stats
    const marketplaceStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_cents) as total_revenue,
        SUM(o.total_cents * 0.1) as total_commissions,
        COUNT(DISTINCT ss.seller_id) as active_sellers
      FROM seller_stats_daily ss
      LEFT JOIN orders o ON o.seller_id = ss.seller_id 
        AND o.created_at >= ${startDate} 
        AND o.created_at <= ${endDate}
        AND o.status IN ('paid', 'packed', 'shipped', 'delivered')
      WHERE ss.date >= ${startDate} AND ss.date <= ${endDate}
        AND ss.orders > 0
    `);

    // Get daily orders chart data
    const dailyOrders = await db.execute(sql`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as orders
      FROM orders o
      WHERE o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
        AND o.status IN ('paid', 'packed', 'shipped', 'delivered')
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `);

    // Get top sellers by revenue
    const topSellers = await db.execute(sql`
      SELECT 
        s.id as seller_id,
        s.brand_name,
        SUM(ss.revenue) as revenue,
        SUM(ss.orders) as orders
      FROM seller_stats_daily ss
      JOIN sellers s ON s.id = ss.seller_id
      WHERE ss.date >= ${startDate}
        AND ss.date <= ${endDate}
      GROUP BY s.id, s.brand_name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const stats = marketplaceStats.rows[0] as any || {
      total_orders: 0,
      total_revenue: 0,
      total_commissions: 0,
      active_sellers: 0
    };

    return NextResponse.json({
      range,
      overview: {
        totalSales: parseInt(stats.total_revenue) || 0,
        totalCommissions: parseInt(stats.total_commissions) || 0,
        activeSellers: parseInt(stats.active_sellers) || 0,
        totalOrders: parseInt(stats.total_orders) || 0
      },
      dailyOrders: dailyOrders.rows.map((row: any) => ({
        date: row.date,
        orders: parseInt(row.orders) || 0
      })),
      topSellers: topSellers.rows.map((row: any) => ({
        sellerId: row.seller_id,
        brandName: row.brand_name,
        revenue: parseInt(row.revenue) || 0,
        orders: parseInt(row.orders) || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea statisticilor' },
      { status: 500 }
    );
  }
}
