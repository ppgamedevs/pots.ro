import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { affiliatePartners, rateLimits } from '@/db/schema/core';
import { desc, eq, sql } from 'drizzle-orm';
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

    const rows = await db.select().from(affiliatePartners).orderBy(desc(affiliatePartners.createdAt));
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

    const limited = await isRateLimited(`admin-affiliates-partner-create-${user.id}`, 60, 3600);
    if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || '').trim();
    const contactEmail = body?.contactEmail ? String(body.contactEmail).trim() : null;
    const websiteUrl = body?.websiteUrl ? String(body.websiteUrl).trim() : null;
    const defaultCommissionBps = body?.defaultCommissionBps == null ? 500 : Number(body.defaultCommissionBps);
    const payoutNotes = body?.payoutNotes ? String(body.payoutNotes).trim() : null;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!Number.isFinite(defaultCommissionBps) || defaultCommissionBps < 0 || defaultCommissionBps > 10000) {
      return NextResponse.json({ error: 'defaultCommissionBps must be 0..10000' }, { status: 400 });
    }

    const [row] = await db
      .insert(affiliatePartners)
      .values({
        name,
        status: 'active',
        contactEmail,
        websiteUrl,
        defaultCommissionBps: Math.trunc(defaultCommissionBps),
        payoutNotes,
      })
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'affiliate_partner_created',
      entityType: 'affiliate_partner',
      entityId: row.id,
      message: 'Affiliate partner created',
      meta: { name, contactEmail, websiteUrl, defaultCommissionBps },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
