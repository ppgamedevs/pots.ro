import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, promotionVersions, assetScanJobs, rateLimits } from '@/db/schema/core';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
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

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || '').trim();
    const approvalStatus = (searchParams.get('approvalStatus') || '').trim();
    const active = (searchParams.get('active') || '').trim();

    const conditions: any[] = [];
    if (type) conditions.push(eq(promotions.type, type as any));
    if (approvalStatus) conditions.push(eq(promotions.approvalStatus, approvalStatus as any));
    if (active === 'true') conditions.push(eq(promotions.active, true));
    if (active === 'false') conditions.push(eq(promotions.active, false));

    const rows = await db
      .select()
      .from(promotions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(promotions.createdAt));

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

    const limited = await isRateLimited(`admin-promotions-create-${user.id}`, 60, 3600);
    if (limited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));

    const title = String(body?.title || '').trim();
    const type = String(body?.type || '').trim();
    const startAt = safeParseDate(body?.startAt);
    const endAt = safeParseDate(body?.endAt);
    const active = body?.active === false ? false : true;

    const percent = body?.percent == null ? null : Number(body.percent);
    const value = body?.value == null ? null : Number(body.value);

    const sellerId = body?.sellerId ? String(body.sellerId).trim() : null;
    const targetCategorySlug = body?.targetCategorySlug ? String(body.targetCategorySlug).trim() : null;
    const targetProductId = body?.targetProductId ? String(body.targetProductId).trim() : null;

    const changeNote = body?.changeNote ? String(body.changeNote).trim() : null;
    const meta = normalizeMeta(body?.meta);

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (type !== 'discount' && type !== 'banner') return NextResponse.json({ error: 'type must be discount|banner' }, { status: 400 });
    if (!startAt || !endAt) return NextResponse.json({ error: 'startAt and endAt are required' }, { status: 400 });
    if (endAt <= startAt) return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });

    if (type === 'discount') {
      const hasPercent = Number.isFinite(percent as any) && (percent as number) > 0;
      const hasValue = Number.isFinite(value as any) && (value as number) > 0;
      if (!hasPercent && !hasValue) return NextResponse.json({ error: 'discount needs percent or value' }, { status: 400 });
      if (hasPercent && ((percent as number) < 1 || (percent as number) > 100)) {
        return NextResponse.json({ error: 'percent must be 1..100' }, { status: 400 });
      }
      if (hasValue && (value as number) <= 0) return NextResponse.json({ error: 'value must be > 0' }, { status: 400 });
    }

    const [row] = await db
      .insert(promotions)
      .values({
        title,
        type: type as any,
        percent: percent && Number.isFinite(percent) ? Math.trunc(percent) : null,
        value: value && Number.isFinite(value) ? Math.trunc(value) : null,
        startAt,
        endAt,
        active,
        sellerId,
        targetCategorySlug,
        targetProductId,
        meta,
        approvalStatus: 'draft',
        changeNote,
        version: 1,
      })
      .returning();

    await db
      .insert(promotionVersions)
      .values({
        promotionId: row.id,
        version: row.version,
        snapshot: row as any,
        createdBy: user.id,
      })
      .onConflictDoNothing();

    const blobPath = extractBlobPath(meta);
    if (type === 'banner' && blobPath) {
      await db
        .insert(assetScanJobs)
        .values({ blobPath, kind: 'banner', status: 'pending', requestedBy: user.id })
        .onConflictDoNothing();
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'promotion_created',
      entityType: 'promotion',
      entityId: row.id,
      message: 'Promotion created (draft)',
      meta: { type, active, sellerId, targetCategorySlug, targetProductId },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
