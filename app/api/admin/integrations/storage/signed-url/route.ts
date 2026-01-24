import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

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
 * Signed URL API
 * Generates time-limited signed URLs for admin access to files
 * Routes through internal gateway, never exposes raw blob URLs for sensitive prefixes
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 50 signed URLs per hour
    const rateLimitKey = `storage-signed-url-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 50, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { path, expiresIn = 300 } = body; // Default 5 minutes

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'path is required' },
        { status: 400 }
      );
    }

    // Validate expiry (max 1 hour)
    const expiry = Math.min(Math.max(60, expiresIn), 3600);

    // Sanitize path - prevent directory traversal
    const sanitizedPath = path
      .replace(/\.\./g, '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');

    // Sensitive prefixes that must go through gateway
    const sensitivePathPrefixes = ['backups/', 'kyc/', 'internal/'];
    const isSensitive = sensitivePathPrefixes.some((p) => sanitizedPath.startsWith(p));

    // Generate signed token
    const expiresAt = Math.floor(Date.now() / 1000) + expiry;
    const payload = `${sanitizedPath}:${expiresAt}:${user.id}`;
    const secret = process.env.SIGNED_URL_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 16);

    // Build signed URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floristmarket.ro';
    const signedUrl = isSensitive
      ? `${baseUrl}/api/files/${sanitizedPath}?sig=${signature}&exp=${expiresAt}&uid=${user.id}`
      : `${baseUrl}/api/files/${sanitizedPath}?sig=${signature}&exp=${expiresAt}`;

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'storage_signed_url_generated',
      entityType: 'storage',
      entityId: sanitizedPath.slice(0, 100),
      meta: {
        expiresIn: expiry,
        isSensitive,
        pathPrefix: sanitizedPath.split('/')[0],
      },
    });

    return NextResponse.json({
      ok: true,
      signedUrl,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      expiresIn: expiry,
      isSensitive,
      note: isSensitive
        ? 'URL routes through internal gateway with additional checks'
        : 'URL provides direct access for duration',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
