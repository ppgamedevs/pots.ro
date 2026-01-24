import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetScanJobs, rateLimits } from '@/db/schema/core';
import { and, desc, eq, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(eq(rateLimits.key, key));

  if (!existing || now > existing.resetAt) {
    await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }

  if (existing.count >= maxRequests) return true;

  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').trim();

    const conditions: any[] = [];
    if (status) conditions.push(eq(assetScanJobs.status, status as any));

    const rows = await db
      .select()
      .from(assetScanJobs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(assetScanJobs.createdAt));

    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const limited = await isRateLimited(`admin-asset-scan-create-${user.id}`, 120, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json().catch(() => ({}));

    const blobPath = String(body?.blobPath || '').trim();
    const kind = String(body?.kind || '').trim() || 'banner';

    if (!blobPath) return NextResponse.json({ error: 'blobPath is required' }, { status: 400 });

    const [row] = await db
      .insert(assetScanJobs)
      .values({ blobPath, kind, status: 'pending', requestedBy: user.id })
      .onConflictDoUpdate({
        target: assetScanJobs.blobPath,
        set: { updatedAt: new Date(), requestedBy: user.id },
      })
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'asset_scan_job_created',
      entityType: 'asset_scan_job',
      entityId: row.id,
      message: 'Asset scan job created/ensured',
      meta: { blobPath, kind },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
