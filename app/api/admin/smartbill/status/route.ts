import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { invoices, settings } from '@/db/schema/core';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import crypto from 'node:crypto';

// SmartBill ENV vars
const SMARTBILL_ENV_VARS = [
  'SMARTBILL_API_BASE',
  'SMARTBILL_USERNAME',
  'SMARTBILL_TOKEN',
  'SMARTBILL_SERIES',
  'COMPANY_VAT_NUMBER',
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
    const envVars: Record<string, { configured: boolean; fingerprint: string | null; isSensitive: boolean }> = {};
    for (const varName of SMARTBILL_ENV_VARS) {
      const val = process.env[varName];
      const isSensitive = ['SMARTBILL_TOKEN', 'SMARTBILL_USERNAME'].includes(varName);
      const configured = isConfigured(varName);
      envVars[varName] = {
        configured,
        fingerprint: isSensitive ? computeFingerprint(val) : (val || null),
        isSensitive,
      };
    }

    // 2. Get current mode from settings (default: sandbox)
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

    // 3. Determine API base URL
    const apiBase = process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api';

    // 4. Check if SmartBill is properly configured
    const configured = isConfigured('SMARTBILL_USERNAME') && isConfigured('SMARTBILL_TOKEN');

    // 5. Determine connection status
    let connectionStatus: 'healthy' | 'unhealthy' | 'not_configured' = 'not_configured';
    if (configured) {
      // Check for recent errors to determine health
      const [errorCount] = await db
        .select({ count: count() })
        .from(invoices)
        .where(and(
          eq(invoices.issuer, 'smartbill'),
          eq(invoices.status, 'error'),
          sql`${invoices.createdAt} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
        ));
      
      const [totalCount] = await db
        .select({ count: count() })
        .from(invoices)
        .where(and(
          eq(invoices.issuer, 'smartbill'),
          sql`${invoices.createdAt} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
        ));

      const errorRate = totalCount && Number(totalCount.count) > 0
        ? Number(errorCount?.count ?? 0) / Number(totalCount.count)
        : 0;

      connectionStatus = errorRate > 0.1 ? 'unhealthy' : 'healthy';
    }

    // 6. Get SmartBill invoice stats
    const smartbillInvoices = await db
      .select({
        status: invoices.status,
        count: count(),
      })
      .from(invoices)
      .where(eq(invoices.issuer, 'smartbill'))
      .groupBy(invoices.status);

    const statusMap: Record<string, number> = {};
    for (const row of smartbillInvoices) {
      statusMap[row.status] = Number(row.count);
    }

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      ok: true,
      status: {
        configured,
        mode,
        apiBase,
        connectionStatus,
        envVars,
        stats: {
          total,
          issued: statusMap.issued || 0,
          voided: statusMap.voided || 0,
          errors: statusMap.error || 0,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
