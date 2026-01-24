import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { productImages, sellerKycDocuments, backupRuns } from '@/db/schema/core';
import { sql, eq, count } from 'drizzle-orm';

/**
 * Storage Usage API
 * Returns file usage statistics by category/prefix
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    // 1. Product images stats
    const [productImageStats] = await db
      .select({
        total: count(),
        approved: sql<number>`count(*) filter (where ${productImages.moderationStatus} = 'approved')`,
        hidden: sql<number>`count(*) filter (where ${productImages.moderationStatus} = 'hidden')`,
        blurred: sql<number>`count(*) filter (where ${productImages.moderationStatus} = 'blurred')`,
        flagged: sql<number>`count(*) filter (where ${productImages.moderationStatus} = 'flagged')`,
      })
      .from(productImages);

    // 2. KYC documents stats
    const [kycStats] = await db
      .select({
        total: count(),
        uploaded: sql<number>`count(*) filter (where ${sellerKycDocuments.status} = 'uploaded')`,
        approved: sql<number>`count(*) filter (where ${sellerKycDocuments.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${sellerKycDocuments.status} = 'rejected')`,
      })
      .from(sellerKycDocuments);

    // 3. Backup files stats
    const [backupStats] = await db
      .select({
        total: count(),
        success: sql<number>`count(*) filter (where ${backupRuns.status} = 'success')`,
        failed: sql<number>`count(*) filter (where ${backupRuns.status} = 'failed')`,
        totalSizeBytes: sql<number>`coalesce(sum(${backupRuns.sizeBytes}), 0)`,
      })
      .from(backupRuns);

    // Format response
    const usage = {
      productImages: {
        total: Number(productImageStats?.total ?? 0),
        byStatus: {
          approved: Number(productImageStats?.approved ?? 0),
          hidden: Number(productImageStats?.hidden ?? 0),
          blurred: Number(productImageStats?.blurred ?? 0),
          flagged: Number(productImageStats?.flagged ?? 0),
        },
      },
      kycDocuments: {
        total: Number(kycStats?.total ?? 0),
        byStatus: {
          uploaded: Number(kycStats?.uploaded ?? 0),
          approved: Number(kycStats?.approved ?? 0),
          rejected: Number(kycStats?.rejected ?? 0),
        },
      },
      backups: {
        total: Number(backupStats?.total ?? 0),
        success: Number(backupStats?.success ?? 0),
        failed: Number(backupStats?.failed ?? 0),
        totalSizeBytes: Number(backupStats?.totalSizeBytes ?? 0),
        totalSizeFormatted: formatBytes(Number(backupStats?.totalSizeBytes ?? 0)),
      },
      summary: {
        totalTrackedFiles:
          Number(productImageStats?.total ?? 0) +
          Number(kycStats?.total ?? 0) +
          Number(backupStats?.total ?? 0),
        flaggedFiles: Number(productImageStats?.flagged ?? 0),
      },
    };

    return NextResponse.json({ ok: true, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
