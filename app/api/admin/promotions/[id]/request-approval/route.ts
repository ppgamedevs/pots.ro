import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, assetScanJobs, rateLimits } from '@/db/schema/core';
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

function extractBlobPath(meta: any): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const raw = meta.blobPath || meta.assetPath || meta.path || null;
  const v = raw ? String(raw).trim() : '';
  return v || null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const limited = await isRateLimited(`admin-promotions-request-approval-${user.id}`, 120, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const row = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (row.approvalStatus === 'pending_approval') {
      return NextResponse.json({ error: 'Already pending approval' }, { status: 409 });
    }
    if (row.approvalStatus === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 409 });
    }
    if (row.approvalStatus === 'disabled') {
      return NextResponse.json({ error: 'Promotion is disabled' }, { status: 409 });
    }

    // Banner safety gate: require a clean scan job if a blobPath is present.
    if (row.type === 'banner') {
      const blobPath = extractBlobPath(row.meta as any);
      if (blobPath) {
        const job = await db.query.assetScanJobs.findFirst({ where: eq(assetScanJobs.blobPath, blobPath) });
        if (!job || job.status !== 'clean') {
          return NextResponse.json(
            { error: 'Banner asset must be scanned and marked clean before requesting approval', blobPath, status: job?.status || null },
            { status: 409 }
          );
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const changeNote = body?.changeNote ? String(body.changeNote).trim() : null;

    const [updated] = await db
      .update(promotions)
      .set({
        approvalStatus: 'pending_approval',
        approvalRequestedBy: user.id,
        approvalRequestedAt: new Date(),
        changeNote: changeNote ?? row.changeNote,
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_approval_requested',
      entityType: 'promotion',
      entityId: id,
      message: 'Promotion approval requested',
      meta: { type: row.type, version: updated.version, changeNote },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
