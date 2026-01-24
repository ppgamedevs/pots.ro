import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { webhookLogs, settings } from '@/db/schema/core';
import { eq, desc, and, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

// ENV vars for Netopia (never expose raw values)
const NETOPIA_ENV_VARS = [
  'NETOPIA_SIGNATURE',
  'NETOPIA_API_KEY',
  'NETOPIA_POS_SIGNATURE',
  'NETOPIA_POS_SIGNATURE_SET',
  'NETOPIA_ACTIVE_POS',
];

// Compute a fingerprint (first 8 chars of SHA-256) for a secret
function computeFingerprint(value: string | undefined): string | null {
  if (!value) return null;
  const hash = crypto.createHash('sha256').update(value).digest('hex');
  return hash.slice(0, 8);
}

// Check if an env var is configured (non-empty)
function isConfigured(varName: string): boolean {
  const val = process.env[varName];
  return typeof val === 'string' && val.trim().length > 0;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    // 1. Check env var presence + fingerprints
    const envStatus: Record<string, { configured: boolean; fingerprint: string | null }> = {};
    for (const varName of NETOPIA_ENV_VARS) {
      const val = process.env[varName];
      envStatus[varName] = {
        configured: isConfigured(varName),
        fingerprint: computeFingerprint(val),
      };
    }

    // 2. Derive callback URLs from public base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://floristmarket.ro';
    const callbackUrls = {
      ipnCallback: `${baseUrl}/api/payments/netopia/callback`,
      returnUrl: `${baseUrl}/finalizare/success`,
      cancelUrl: `${baseUrl}/finalizare/fail`,
    };

    // 3. Get current mode from settings (default: sandbox)
    let mode: 'sandbox' | 'production' = 'sandbox';
    try {
      const [modeRow] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, 'netopia_mode'))
        .limit(1);
      if (modeRow?.value === 'production') {
        mode = 'production';
      }
    } catch {
      // Settings table might not have this key yet
    }

    // 4. Get last webhook events for Netopia (from webhook_logs)
    const recentEvents = await db
      .select({
        id: webhookLogs.id,
        source: webhookLogs.source,
        ref: webhookLogs.ref,
        result: webhookLogs.result,
        createdAt: webhookLogs.createdAt,
      })
      .from(webhookLogs)
      .where(eq(webhookLogs.source, 'payments'))
      .orderBy(desc(webhookLogs.createdAt))
      .limit(10);

    // 5. Get event counts (last 24h, last 7d)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last24hCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookLogs)
      .where(and(
        eq(webhookLogs.source, 'payments'),
        sql`${webhookLogs.createdAt} >= ${oneDayAgo.toISOString()}`
      ));

    const [last7dCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookLogs)
      .where(and(
        eq(webhookLogs.source, 'payments'),
        sql`${webhookLogs.createdAt} >= ${sevenDaysAgo.toISOString()}`
      ));

    return NextResponse.json({
      ok: true,
      status: {
        envVars: envStatus,
        callbackUrls,
        mode,
        stats: {
          eventsLast24h: Number(last24hCount?.count ?? 0),
          eventsLast7d: Number(last7dCount?.count ?? 0),
        },
        recentEvents: recentEvents.map((e: typeof recentEvents[number]) => ({
          id: String(e.id),
          source: e.source,
          ref: e.ref,
          result: e.result,
          createdAt: e.createdAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
