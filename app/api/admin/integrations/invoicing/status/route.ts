import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { invoices, settings } from '@/db/schema/core';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import crypto from 'node:crypto';

// ENV vars for SmartBill (never expose raw values)
const SMARTBILL_ENV_VARS = [
  'SMARTBILL_USERNAME',
  'SMARTBILL_TOKEN',
  'SMARTBILL_SERIES',
  'SMARTBILL_API_BASE',
  'INVOICE_PROVIDER',
  'COMPANY_VAT_NUMBER',
];

// Facturis ENV vars (alternative provider)
const FACTURIS_ENV_VARS = [
  'FACTURIS_API_KEY',
  'FACTURIS_API_BASE',
  'FACTURIS_COMPANY_CIF',
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

    // 1. Determine active provider
    const activeProvider = process.env.INVOICE_PROVIDER || 'mock';

    // 2. Check env var presence + fingerprints
    const smartbillStatus: Record<string, { configured: boolean; fingerprint: string | null; isSensitive: boolean }> = {};
    for (const varName of SMARTBILL_ENV_VARS) {
      const val = process.env[varName];
      const isSensitive = ['SMARTBILL_TOKEN', 'SMARTBILL_USERNAME'].includes(varName);
      smartbillStatus[varName] = {
        configured: isConfigured(varName),
        fingerprint: isSensitive ? computeFingerprint(val) : (val || null),
        isSensitive,
      };
    }

    const facturisStatus: Record<string, { configured: boolean; fingerprint: string | null; isSensitive: boolean }> = {};
    for (const varName of FACTURIS_ENV_VARS) {
      const val = process.env[varName];
      const isSensitive = varName === 'FACTURIS_API_KEY';
      facturisStatus[varName] = {
        configured: isConfigured(varName),
        fingerprint: isSensitive ? computeFingerprint(val) : (val || null),
        isSensitive,
      };
    }

    // 3. Get current mode from settings (default: sandbox)
    let mode: 'sandbox' | 'production' = 'sandbox';
    try {
      const [modeRow] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, 'invoice_mode'))
        .limit(1);
      if (modeRow?.value === 'production') {
        mode = 'production';
      }
    } catch {
      // Settings table might not have this key yet
    }

    // 4. Get invoice stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total counts by status
    const statusCounts = await db
      .select({
        status: invoices.status,
        count: count(),
      })
      .from(invoices)
      .groupBy(invoices.status);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = Number(row.count);
    }

    // Issuer counts
    const issuerCounts = await db
      .select({
        issuer: invoices.issuer,
        count: count(),
      })
      .from(invoices)
      .groupBy(invoices.issuer);

    const issuerMap: Record<string, number> = {};
    for (const row of issuerCounts) {
      issuerMap[row.issuer] = Number(row.count);
    }

    // Last 24h issued
    const [last24hIssued] = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'issued'),
        sql`${invoices.createdAt} >= ${oneDayAgo.toISOString()}`
      ));

    // Last 7d issued
    const [last7dIssued] = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'issued'),
        sql`${invoices.createdAt} >= ${sevenDaysAgo.toISOString()}`
      ));

    // 5. Get recent errors
    const recentErrors = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        type: invoices.type,
        issuer: invoices.issuer,
        errorMessage: invoices.errorMessage,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.status, 'error'))
      .orderBy(desc(invoices.createdAt))
      .limit(10);

    // 6. Get recent invoices
    const recentInvoices = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        type: invoices.type,
        series: invoices.series,
        number: invoices.number,
        issuer: invoices.issuer,
        status: invoices.status,
        total: invoices.total,
        currency: invoices.currency,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(10);

    // Check if SmartBill is properly configured
    const smartbillConfigured = isConfigured('SMARTBILL_USERNAME') && isConfigured('SMARTBILL_TOKEN');
    const facturisConfigured = isConfigured('FACTURIS_API_KEY');

    const healthStatus = {
      isHealthy: activeProvider === 'mock' || 
        (activeProvider === 'smartbill' && smartbillConfigured) ||
        (activeProvider === 'facturis' && facturisConfigured),
      errorRate: statusMap.error && (statusMap.issued || 0) > 0 
        ? (statusMap.error / ((statusMap.issued || 0) + statusMap.error) * 100).toFixed(2)
        : '0.00',
      pendingErrors: statusMap.error || 0,
    };

    return NextResponse.json({
      ok: true,
      status: {
        activeProvider,
        mode,
        health: healthStatus,
        smartbill: smartbillStatus,
        facturis: facturisStatus,
        stats: {
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
          issued: statusMap.issued || 0,
          voided: statusMap.voided || 0,
          errors: statusMap.error || 0,
          byIssuer: issuerMap,
          issuedLast24h: Number(last24hIssued?.count ?? 0),
          issuedLast7d: Number(last7dIssued?.count ?? 0),
        },
        recentErrors: recentErrors.map(e => ({
          id: e.id,
          orderId: e.orderId,
          type: e.type,
          issuer: e.issuer,
          errorMessage: e.errorMessage,
          createdAt: e.createdAt?.toISOString() ?? null,
        })),
        recentInvoices: recentInvoices.map(inv => ({
          id: inv.id,
          orderId: inv.orderId,
          type: inv.type,
          series: inv.series,
          number: inv.number,
          issuer: inv.issuer,
          status: inv.status,
          total: inv.total,
          currency: inv.currency,
          createdAt: inv.createdAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
