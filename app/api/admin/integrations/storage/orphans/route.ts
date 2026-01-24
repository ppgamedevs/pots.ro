import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { productImages } from '@/db/schema/core';
import { eq, isNotNull, sql, and, or } from 'drizzle-orm';
import { head } from '@vercel/blob';

/**
 * Orphan Detection API
 * Detects DB rows referencing blob paths that may no longer exist
 * Uses sampling to avoid excessive blob API calls
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    // Get product images with URLs to check
    const imagesToCheck = await db
      .select({
        id: productImages.id,
        productId: productImages.productId,
        url: productImages.url,
        moderationStatus: productImages.moderationStatus,
        createdAt: productImages.createdAt,
      })
      .from(productImages)
      .where(isNotNull(productImages.url))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    // Check each URL for existence (sample-based)
    const orphanCandidates: Array<{
      id: number;
      productId: number;
      url: string;
      status: string;
      error: string | null;
      createdAt: Date | null;
    }> = [];

    const checkedUrls: Array<{
      id: number;
      url: string;
      exists: boolean;
      error: string | null;
    }> = [];

    for (const img of imagesToCheck) {
      if (!img.url) continue;

      try {
        // Try to get blob metadata
        await head(img.url);
        checkedUrls.push({
          id: img.id,
          url: img.url,
          exists: true,
          error: null,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        
        // If blob doesn't exist, it's an orphan candidate
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          orphanCandidates.push({
            id: img.id,
            productId: img.productId,
            url: img.url,
            status: img.moderationStatus || 'unknown',
            error: 'Blob not found',
            createdAt: img.createdAt,
          });
        }

        checkedUrls.push({
          id: img.id,
          url: img.url,
          exists: false,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      orphans: {
        candidates: orphanCandidates,
        checkedCount: checkedUrls.length,
        orphanCount: orphanCandidates.length,
        note: 'Sample-based detection. Run multiple times or increase limit for comprehensive scan.',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
