import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { affiliateCodes, affiliatePartners, rateLimits } from '@/db/schema/core';
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

function safeParseDate(value: unknown): Date | null {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeCode(input: unknown) {
  const code = String(input || '').trim().toUpperCase();
  return code.replace(/\s+/g, '');
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const rows = await db
      .select()
      .from(affiliateCodes)
      .orderBy(desc(affiliateCodes.createdAt));

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

    const limited = await isRateLimited(`admin-affiliates-code-create-${user.id}`, 120, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json().catch(() => ({}));

    const partnerId = String(body?.partnerId || '').trim();
    const code = normalizeCode(body?.code);

    const commissionBps = body?.commissionBps == null ? null : Number(body.commissionBps);
    const maxUses = body?.maxUses == null ? null : Number(body.maxUses);
    const startsAt = body?.startsAt ? safeParseDate(body.startsAt) : null;
    const endsAt = body?.endsAt ? safeParseDate(body.endsAt) : null;
    const meta = body?.meta && typeof body.meta === 'object' ? body.meta : null;

    if (!partnerId) return NextResponse.json({ error: 'partnerId is required' }, { status: 400 });
    if (!code || code.length < 3) return NextResponse.json({ error: 'code is required (min 3 chars)' }, { status: 400 });

    const partner = await db.query.affiliatePartners.findFirst({ where: and(eq(affiliatePartners.id, partnerId), eq(affiliatePartners.status, 'active')) });
    if (!partner) return NextResponse.json({ error: 'Partner not found or disabled' }, { status: 404 });

    if (commissionBps != null) {
      if (!Number.isFinite(commissionBps) || commissionBps < 0 || commissionBps > 10000) {
        return NextResponse.json({ error: 'commissionBps must be 0..10000' }, { status: 400 });
      }
    }
    if (maxUses != null) {
      if (!Number.isFinite(maxUses) || maxUses < 1) return NextResponse.json({ error: 'maxUses must be >= 1' }, { status: 400 });
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400 });
    }

    let row;
    try {
      [row] = await db
        .insert(affiliateCodes)
        .values({
          partnerId,
          code,
          status: 'active',
          commissionBps: commissionBps == null ? null : Math.trunc(commissionBps),
          maxUses: maxUses == null ? null : Math.trunc(maxUses),
          startsAt,
          endsAt,
          meta,
        })
        .returning();
    } catch (e: any) {
      const msg = String(e?.message || 'Failed');
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
      }
      throw e;
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'affiliate_code_created',
      entityType: 'affiliate_code',
      entityId: row.id,
      message: 'Affiliate code created',
      meta: { partnerId, code, commissionBps, maxUses },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
