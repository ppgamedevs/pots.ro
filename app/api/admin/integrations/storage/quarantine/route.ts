import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { productImages, rateLimits } from '@/db/schema/core';
import { eq, inArray, sql } from 'drizzle-orm';

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
 * Quarantine API
 * Marks files as quarantined in DB and blocks downloads via gateway
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 20 quarantine operations per hour
    const rateLimitKey = `storage-quarantine-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 20, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { imageIds, reason, action = 'quarantine' } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'imageIds array is required' },
        { status: 400 }
      );
    }

    if (imageIds.length > 50) {
      return NextResponse.json(
        { ok: false, error: 'Max 50 images per request' },
        { status: 400 }
      );
    }

    if (action !== 'quarantine' && action !== 'unquarantine') {
      return NextResponse.json(
        { ok: false, error: 'action must be "quarantine" or "unquarantine"' },
        { status: 400 }
      );
    }

    const isQuarantine = action === 'quarantine';

    // Update moderation status to flag/unflag images
    // Quarantine = set to 'flagged' status
    // Unquarantine = set to 'approved' status
    const result = await db
      .update(productImages)
      .set({
        moderationStatus: isQuarantine ? 'flagged' : 'approved',
        moderatedBy: user.id,
        moderatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(productImages.id, imageIds))
      .returning({ id: productImages.id });

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: isQuarantine ? 'storage_quarantine' : 'storage_unquarantine',
      entityType: 'storage',
      entityId: 'product_images',
      meta: {
        imageIds: imageIds.slice(0, 10),
        totalCount: imageIds.length,
        affectedCount: result.length,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      affectedCount: result.length,
      message: isQuarantine
        ? `${result.length} images quarantined`
        : `${result.length} images released from quarantine`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

/**
 * GET quarantined files list (flagged images)
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    // Get flagged images (quarantine = flagged status)
    const quarantinedFiles = await db
      .select({
        id: productImages.id,
        productId: productImages.productId,
        url: productImages.url,
        moderationStatus: productImages.moderationStatus,
        moderatedBy: productImages.moderatedBy,
        moderatedAt: productImages.moderatedAt,
        createdAt: productImages.createdAt,
        updatedAt: productImages.updatedAt,
      })
      .from(productImages)
      .where(eq(productImages.moderationStatus, 'flagged'))
      .limit(limit);

    return NextResponse.json({
      ok: true,
      quarantined: quarantinedFiles.map((f: typeof quarantinedFiles[number]) => ({
        id: f.id,
        productId: f.productId,
        urlPreview: f.url ? f.url.slice(0, 60) + '...' : null,
        status: f.moderationStatus,
        moderatedBy: f.moderatedBy,
        moderatedAt: f.moderatedAt?.toISOString() ?? null,
        createdAt: f.createdAt?.toISOString() ?? null,
        updatedAt: f.updatedAt?.toISOString() ?? null,
      })),
      total: quarantinedFiles.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
