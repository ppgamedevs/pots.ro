import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { emailService } from "@/lib/email";
import React from "react";
import { getAdminAlertRecipients } from "@/lib/alerts/recipients";
import { runRetentionPurge } from '@/lib/retention/purge';

export async function GET(request: NextRequest) {
  try {
    const results = {
      sitemapWarmup: false,
      healthCheck: false,
      cleanup: false,
      reportSent: false,
      analyticsAggregation: false,
    };

    // 1. Warm up sitemap routes to refresh cache
    try {
      const baseUrl = process.env.APP_BASE_URL || 'https://floristmarket.ro';
      const sitemapRoutes = [
        '/sitemap.xml',
        '/sitemaps/products.xml',
        '/sitemaps/sellers.xml',
        '/sitemaps/categories.xml',
        '/sitemaps/blog.xml',
      ];

      for (const route of sitemapRoutes) {
        try {
          await fetch(`${baseUrl}${route}`, {
            headers: { 'User-Agent': 'Vercel-Cron/1.0' },
          });
        } catch (error) {
          console.warn(`Failed to warm up ${route}:`, error);
        }
      }
      results.sitemapWarmup = true;
    } catch (error) {
      console.error('Sitemap warmup error:', error);
    }

    // 2. Call health check
    try {
      const baseUrl = process.env.APP_BASE_URL || 'https://floristmarket.ro';
      const healthResponse = await fetch(`${baseUrl}/api/health`, {
        headers: { 'User-Agent': 'Vercel-Cron/1.0' },
      });
      
      const healthData = await healthResponse.json();
      results.healthCheck = healthResponse.ok;
      
      // If any check fails, send report email
      if (!healthResponse.ok) {
        await sendHealthReportEmail(healthData);
        results.reportSent = true;
      }
    } catch (error) {
      console.error('Health check error:', error);
      await sendHealthReportEmail({ error: error instanceof Error ? error.message : 'Unknown error' });
      results.reportSent = true;
    }

    // 3. Analytics aggregation (aggregate yesterday's events)
    try {
      // Check if analytics tables exist before trying to aggregate
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'seller_stats_daily'
        ) as seller_stats_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'events_raw'
        ) as events_raw_exists
      `);

      const tablesExist = tableCheck.rows[0] as any;
      
      if (tablesExist.seller_stats_exists && tablesExist.events_raw_exists) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setDate(today.getDate());
        today.setHours(0, 0, 0, 0);

        // Aggregate seller stats for yesterday
        const sellerStats = await db.execute(sql`
          INSERT INTO seller_stats_daily (seller_id, date, views, add_to_cart, orders, revenue, created_at, updated_at)
          SELECT 
            seller_id,
            ${yesterday},
            COUNT(CASE WHEN event_type = 'product-view' THEN 1 END) as views,
            COUNT(CASE WHEN event_type = 'cart-add' THEN 1 END) as add_to_cart,
            COUNT(CASE WHEN event_type = 'order-placed' THEN 1 END) as orders,
            COALESCE(SUM(CASE WHEN event_type = 'order-placed' THEN (metadata->>'revenue')::integer END), 0) as revenue,
            NOW(),
            NOW()
          FROM events_raw
          WHERE created_at >= ${yesterday} AND created_at < ${today}
            AND seller_id IS NOT NULL
          GROUP BY seller_id
          ON CONFLICT (seller_id, date) 
          DO UPDATE SET
            views = EXCLUDED.views,
            add_to_cart = EXCLUDED.add_to_cart,
            orders = EXCLUDED.orders,
            revenue = EXCLUDED.revenue,
            updated_at = NOW()
        `);

        // Aggregate product stats for yesterday
        const productStats = await db.execute(sql`
          INSERT INTO product_stats_daily (product_id, date, views, add_to_cart, orders, revenue, created_at, updated_at)
          SELECT 
            product_id,
            ${yesterday},
            COUNT(CASE WHEN event_type = 'product-view' THEN 1 END) as views,
            COUNT(CASE WHEN event_type = 'cart-add' THEN 1 END) as add_to_cart,
            COUNT(CASE WHEN event_type = 'order-placed' THEN 1 END) as orders,
            COALESCE(SUM(CASE WHEN event_type = 'order-placed' THEN (metadata->>'revenue')::integer END), 0) as revenue,
            NOW(),
            NOW()
          FROM events_raw
          WHERE created_at >= ${yesterday} AND created_at < ${today}
            AND product_id IS NOT NULL
          GROUP BY product_id
          ON CONFLICT (product_id, date) 
          DO UPDATE SET
            views = EXCLUDED.views,
            add_to_cart = EXCLUDED.add_to_cart,
            orders = EXCLUDED.orders,
            revenue = EXCLUDED.revenue,
            updated_at = NOW()
        `);

        results.analyticsAggregation = true;
      } else {
        console.log('Analytics tables not found, skipping aggregation');
        results.analyticsAggregation = false;
      }
    } catch (error) {
      console.error('Analytics aggregation error:', error);
      results.analyticsAggregation = false;
    }

    // 4. Retention cleanup (settings-driven; supports dry-run)
    try {
      const retention = await runRetentionPurge();
      (results as any).retention = retention;
      results.cleanup = true;
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    return NextResponse.json({
      ok: true,
      message: 'Daily maintenance completed',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Daily maintenance error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function sendHealthReportEmail(healthData: any) {
  try {
    const adminEmails = await getAdminAlertRecipients();
    
    for (const email of adminEmails) {
      await emailService.sendEmail({
        to: email.trim(),
        subject: '🚨 Pots.ro Health Check Failed',
        template: React.createElement('div', {
          style: {
            fontFamily: 'Arial, sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
          },
        }, [
          React.createElement('h1', { 
            key: 'title',
            style: { color: '#d32f2f' } 
          }, 'Health Check Failed'),
          React.createElement('p', { key: 'desc' }, 'The daily health check has detected issues with the Pots.ro system.'),
          React.createElement('h2', { key: 'results-title' }, 'Health Check Results:'),
          React.createElement('pre', { 
            key: 'results',
            style: { backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' } 
          }, JSON.stringify(healthData, null, 2)),
          React.createElement('p', { key: 'action' }, 'Please investigate and resolve these issues as soon as possible.'),
          React.createElement('p', { key: 'timestamp' }, `Timestamp: ${new Date().toISOString()}`),
        ]),
      });
    }
  } catch (error) {
    console.error('Failed to send health report email:', error);
  }
}
