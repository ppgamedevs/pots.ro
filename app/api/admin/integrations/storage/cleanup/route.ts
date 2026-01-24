import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { productImages, rateLimits } from '@/db/schema/core';
import { eq, inArray, lt, sql, and } from 'drizzle-orm';

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
 * Cleanup API
 * Removes orphaned DB records (images referencing non-existent blobs)
 * Does NOT delete blobs directly - only cleans up DB references
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 5 cleanup operations per hour
    const rateLimitKey = `storage-cleanup-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 5, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { imageIds, olderThanDays, dryRun = true } = body;

    if (!imageIds && !olderThanDays) {
      return NextResponse.json(
        { ok: false, error: 'Provide either imageIds array or olderThanDays threshold' },
        { status: 400 }
      );
    }

    let affectedRows: Array<{ id: string; url: string | null }> = [];

    if (imageIds && Array.isArray(imageIds) && imageIds.length > 0) {
      // Delete specific IDs
      if (imageIds.length > 100) {
        return NextResponse.json(
          { ok: false, error: 'Max 100 IDs per request' },
          { status: 400 }
        );
      }

      affectedRows = await db
        .select({ id: productImages.id, url: productImages.url })
        .from(productImages)
        .where(inArray(productImages.id, imageIds));

      if (!dryRun && affectedRows.length > 0) {
        await db
          .delete(productImages)
          .where(inArray(productImages.id, imageIds));
      }
    } else if (olderThanDays && typeof olderThanDays === 'number') {
      // Delete records older than threshold with certain statuses
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      affectedRows = await db
        .select({ id: productImages.id, url: productImages.url })
        .from(productImages)
        .where(
          and(
            lt(productImages.createdAt, cutoffDate),
            eq(productImages.moderationStatus, 'hidden')
          )
        )
        .limit(100);

      if (!dryRun && affectedRows.length > 0) {
        const ids = affectedRows.map((r) => r.id);
        await db
          .delete(productImages)
          .where(inArray(productImages.id, ids));
      }
    }

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: dryRun ? 'storage_cleanup_preview' : 'storage_cleanup_execute',
      entityType: 'storage',
      entityId: 'product_images',
      meta: {
        dryRun,
        affectedCount: affectedRows.length,
        imageIds: imageIds?.slice(0, 10),
        olderThanDays,
      },
    });

    return NextResponse.json({
      ok: true,
      dryRun,
      affectedCount: affectedRows.length,
      affectedRows: affectedRows.slice(0, 20).map((r) => ({
        id: r.id,
        urlPreview: r.url ? r.url.slice(0, 50) + '...' : null,
      })),
      message: dryRun
        ? `Preview: ${affectedRows.length} records would be deleted`
        : `Deleted ${affectedRows.length} records`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
