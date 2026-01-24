import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, promotionVersions } from '@/db/schema/core';
import { and, desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const row = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const toVersion = Number(body?.version);
    if (!Number.isFinite(toVersion) || toVersion < 1) {
      return NextResponse.json({ error: 'version must be a positive number' }, { status: 400 });
    }

    const versionRow = await db.query.promotionVersions.findFirst({
      where: and(eq(promotionVersions.promotionId, id), eq(promotionVersions.version, toVersion)),
    });
    if (!versionRow) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

    const snapshot: any = versionRow.snapshot || {};

    const nextVersion = (row.version || 1) + 1;

    const [updated] = await db
      .update(promotions)
      .set({
        title: snapshot.title ?? row.title,
        type: snapshot.type ?? row.type,
        percent: snapshot.percent ?? null,
        value: snapshot.value ?? null,
        startAt: snapshot.startAt ? new Date(snapshot.startAt) : row.startAt,
        endAt: snapshot.endAt ? new Date(snapshot.endAt) : row.endAt,
        active: snapshot.active ?? row.active,
        sellerId: snapshot.sellerId ?? null,
        targetCategorySlug: snapshot.targetCategorySlug ?? null,
        targetProductId: snapshot.targetProductId ?? null,
        meta: snapshot.meta ?? null,
        approvalStatus: 'draft',
        approvalRequestedBy: null,
        approvalRequestedAt: null,
        approvedBy: null,
        approvedAt: null,
        changeNote: `Rollback to v${toVersion}`,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();

    await db
      .insert(promotionVersions)
      .values({ promotionId: id, version: updated.version, snapshot: updated as any, createdBy: user.id })
      .onConflictDoNothing();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_rollback',
      entityType: 'promotion',
      entityId: id,
      message: 'Promotion rolled back to prior version (draft)',
      meta: { fromVersion: row.version, toVersion, newVersion: updated.version },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, ['admin']);
    const { id } = await params;

    const rows = await db
      .select()
      .from(promotionVersions)
      .where(eq(promotionVersions.promotionId, id))
      .orderBy(desc(promotionVersions.version));

    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
