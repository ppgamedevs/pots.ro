import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, promotionVersions, assetScanJobs, rateLimits } from '@/db/schema/core';
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

function safeParseDate(value: unknown): Date | null {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeMeta(meta: unknown) {
  if (meta == null) return null;
  if (typeof meta === 'object') return meta as any;
  try {
    return JSON.parse(String(meta));
  } catch {
    return null;
  }
}

function extractBlobPath(meta: any): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const raw = meta.blobPath || meta.assetPath || meta.path || null;
  const v = raw ? String(raw).trim() : '';
  return v || null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, ['admin']);
    const { id } = await params;

    const row = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const limited = await isRateLimited(`admin-promotions-update-${user.id}`, 120, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const existing = await db.query.promotions.findFirst({ where: eq(promotions.id, id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (existing.approvalStatus === 'pending_approval') {
      return NextResponse.json({ error: 'Cannot edit while pending approval' }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));

    const patch: any = {};
    if (body.title != null) patch.title = String(body.title).trim();
    if (body.type != null) patch.type = String(body.type).trim();
    if (body.percent != null) patch.percent = body.percent === null ? null : Math.trunc(Number(body.percent));
    if (body.value != null) patch.value = body.value === null ? null : Math.trunc(Number(body.value));

    if (body.startAt != null) patch.startAt = safeParseDate(body.startAt);
    if (body.endAt != null) patch.endAt = safeParseDate(body.endAt);
    if (body.active != null) patch.active = !!body.active;

    if (body.sellerId !== undefined) patch.sellerId = body.sellerId ? String(body.sellerId).trim() : null;
    if (body.targetCategorySlug !== undefined) patch.targetCategorySlug = body.targetCategorySlug ? String(body.targetCategorySlug).trim() : null;
    if (body.targetProductId !== undefined) patch.targetProductId = body.targetProductId ? String(body.targetProductId).trim() : null;

    if (body.changeNote !== undefined) patch.changeNote = body.changeNote ? String(body.changeNote).trim() : null;
    if (body.meta !== undefined) patch.meta = normalizeMeta(body.meta);

    if (patch.type && patch.type !== 'discount' && patch.type !== 'banner') {
      return NextResponse.json({ error: 'type must be discount|banner' }, { status: 400 });
    }

    if (patch.startAt && !patch.endAt && existing.endAt <= patch.startAt) {
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });
    }
    if (patch.endAt && !patch.startAt && patch.endAt <= existing.startAt) {
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });
    }
    if (patch.startAt && patch.endAt && patch.endAt <= patch.startAt) {
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });
    }

    // Any edit to an approved promotion forces back to draft + requires re-approval.
    const nextVersion = (existing.version || 1) + 1;
    const needsDraftReset = existing.approvalStatus === 'approved';

    const [updated] = await db
      .update(promotions)
      .set({
        ...patch,
        version: nextVersion,
        ...(needsDraftReset
          ? {
              approvalStatus: 'draft',
              approvalRequestedBy: null,
              approvalRequestedAt: null,
              approvedBy: null,
              approvedAt: null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();

    await db
      .insert(promotionVersions)
      .values({
        promotionId: updated.id,
        version: updated.version,
        snapshot: updated as any,
        createdBy: user.id,
      })
      .onConflictDoNothing();

    const meta = (patch.meta !== undefined ? patch.meta : existing.meta) as any;
    const blobPath = extractBlobPath(meta);
    if ((patch.type || existing.type) === 'banner' && blobPath) {
      await db
        .insert(assetScanJobs)
        .values({ blobPath, kind: 'banner', status: 'pending', requestedBy: user.id })
        .onConflictDoNothing();
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_updated',
      entityType: 'promotion',
      entityId: id,
      message: needsDraftReset ? 'Promotion updated; reset to draft for re-approval' : 'Promotion updated',
      meta: { needsDraftReset, version: updated.version },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const [row] = await db
      .update(promotions)
      .set({ active: false, approvalStatus: 'disabled', updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_disabled',
      entityType: 'promotion',
      entityId: id,
      message: 'Promotion disabled',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
