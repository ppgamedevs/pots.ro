import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetScanJobs, rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const limited = await isRateLimited(`admin-asset-scan-update-${user.id}`, 240, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const existing = await db.query.assetScanJobs.findFirst({ where: eq(assetScanJobs.id, id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const status = body?.status ? String(body.status).trim() : null;
    const result = body?.result && typeof body.result === 'object' ? body.result : null;

    const allowed = ['pending', 'clean', 'quarantined', 'failed'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: `status must be one of ${allowed.join(', ')}` }, { status: 400 });
    }

    const [row] = await db
      .update(assetScanJobs)
      .set({ status: status as any, result, updatedAt: new Date() })
      .where(eq(assetScanJobs.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'asset_scan_job_updated',
      entityType: 'asset_scan_job',
      entityId: id,
      message: 'Asset scan job status updated',
      meta: { from: existing.status, to: status, blobPath: existing.blobPath },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
