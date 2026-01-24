import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, assetScanJobs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

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

    const row = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (row.approvalStatus !== 'pending_approval') {
      return NextResponse.json({ error: 'Promotion not pending approval' }, { status: 409 });
    }

    if (!row.approvalRequestedBy) {
      return NextResponse.json({ error: 'Approval must be requested first' }, { status: 409 });
    }

    if (row.approvalRequestedBy === user.id) {
      return NextResponse.json({ error: 'Second-person approval required' }, { status: 409 });
    }

    // Banner safety gate: require a clean scan job if a blobPath is present.
    if (row.type === 'banner') {
      const blobPath = extractBlobPath(row.meta as any);
      if (blobPath) {
        const job = await db.query.assetScanJobs.findFirst({ where: eq(assetScanJobs.blobPath, blobPath) });
        if (!job || job.status !== 'clean') {
          return NextResponse.json(
            { error: 'Banner asset must be scanned and marked clean before approval', blobPath, status: job?.status || null },
            { status: 409 }
          );
        }
      }
    }

    const [updated] = await db
      .update(promotions)
      .set({ approvalStatus: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_approved',
      entityType: 'promotion',
      entityId: id,
      message: 'Promotion approved (second person)',
      meta: { requestedBy: row.approvalRequestedBy, version: updated.version },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
