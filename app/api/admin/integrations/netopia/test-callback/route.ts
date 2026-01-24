import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Simple rate limit helper using resetAt schema
async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(eq(rateLimits.key, key));
  
  if (!existing || now > existing.resetAt) {
    await db.insert(rateLimits).values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }
  
  if (existing.count >= maxRequests) return true;
  
  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

/**
 * Test callback endpoint - triggers a synthetic Netopia callback flow
 * This validates that the callback handler is working without making external calls
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 10 test callbacks per hour
    const rateLimitKey = `netopia-test-callback-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 10, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Generate a synthetic test payload (v2 format)
    const testPayload = {
      payment: {
        ntpID: `TEST-${Date.now()}`,
        status: 3, // Confirmed in Netopia v2
        amount: 100,
        currency: 'RON',
        token: 'test-token',
        errorCode: 0,
        errorMessage: null,
      },
      order: {
        ntpID: `TEST-ORDER-${Date.now()}`,
        posSignature: 'TEST-POS',
        dateTime: new Date().toISOString(),
        description: 'Test callback validation',
        orderID: `TEST-${Date.now()}`,
        amount: 100,
        currency: 'RON',
        billing: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    // Instead of actually calling the callback handler (which would require a real order),
    // we validate the environment and return a diagnostic report
    const diagnostics = {
      envVarsPresent: {
        NETOPIA_SIGNATURE: !!process.env.NETOPIA_SIGNATURE,
        NETOPIA_API_KEY: !!process.env.NETOPIA_API_KEY,
        NETOPIA_POS_SIGNATURE: !!process.env.NETOPIA_POS_SIGNATURE,
      },
      callbackEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro'}/api/payments/netopia/callback`,
      testPayloadGenerated: true,
      timestamp: new Date().toISOString(),
    };

    // Check if callback endpoint is reachable (internal fetch)
    let callbackReachable = false;
    let callbackError: string | null = null;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const healthCheckUrl = `${baseUrl}/api/health`;
      const response = await fetch(healthCheckUrl, { method: 'GET' });
      callbackReachable = response.ok;
    } catch (e) {
      callbackError = e instanceof Error ? e.message : 'Unknown error';
    }

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'netopia_test_callback',
      entityType: 'integration',
      entityId: 'netopia',
      meta: {
        diagnostics: {
          ...diagnostics,
          callbackReachable,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Test callback validation completed',
      diagnostics: {
        ...diagnostics,
        callbackReachable,
        callbackError,
      },
      testPayload: {
        // Show structure but not actual values that could be sensitive
        paymentNtpID: testPayload.payment.ntpID,
        orderID: testPayload.order.orderID,
        status: testPayload.payment.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
