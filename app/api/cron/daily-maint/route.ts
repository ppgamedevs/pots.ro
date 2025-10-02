import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookLogs, emailEvents } from "@/db/schema/core";
import { lt } from "drizzle-orm";
import { emailService } from "@/lib/email";
import React from "react";

export async function GET(request: NextRequest) {
  try {
    const results = {
      sitemapWarmup: false,
      healthCheck: false,
      cleanup: false,
      reportSent: false,
    };

    // 1. Warm up sitemap routes to refresh cache
    try {
      const baseUrl = process.env.APP_BASE_URL || 'https://pots.ro';
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
      const baseUrl = process.env.APP_BASE_URL || 'https://pots.ro';
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

    // 3. Cleanup old logs (>90 days)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Clean up old webhook logs
      await db
        .delete(webhookLogs)
        .where(lt(webhookLogs.createdAt, ninetyDaysAgo));

      // Clean up old email events
      await db
        .delete(emailEvents)
        .where(lt(emailEvents.createdAt, ninetyDaysAgo));

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
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['ops@pots.ro'];
    
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
