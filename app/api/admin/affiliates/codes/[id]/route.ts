import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { affiliateCodes } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin']);
    const { id } = await params;

    const existing = await db.query.affiliateCodes.findFirst({ where: eq(affiliateCodes.id, id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const patch: any = {};

    if (body.code != null) patch.code = normalizeCode(body.code);
    if (body.status != null) patch.status = String(body.status).trim();
    if (body.commissionBps !== undefined) patch.commissionBps = body.commissionBps == null ? null : Math.trunc(Number(body.commissionBps));
    if (body.maxUses !== undefined) patch.maxUses = body.maxUses == null ? null : Math.trunc(Number(body.maxUses));
    if (body.startsAt !== undefined) patch.startsAt = body.startsAt ? safeParseDate(body.startsAt) : null;
    if (body.endsAt !== undefined) patch.endsAt = body.endsAt ? safeParseDate(body.endsAt) : null;
    if (body.meta !== undefined) patch.meta = body.meta && typeof body.meta === 'object' ? body.meta : null;

    if (patch.status && patch.status !== 'active' && patch.status !== 'disabled') {
      return NextResponse.json({ error: 'status must be active|disabled' }, { status: 400 });
    }
    if (patch.code && patch.code.length < 3) return NextResponse.json({ error: 'code too short' }, { status: 400 });
    if (patch.commissionBps !== undefined && patch.commissionBps !== null) {
      if (!Number.isFinite(patch.commissionBps) || patch.commissionBps < 0 || patch.commissionBps > 10000) {
        return NextResponse.json({ error: 'commissionBps must be 0..10000' }, { status: 400 });
      }
    }
    if (patch.maxUses !== undefined && patch.maxUses !== null) {
      if (!Number.isFinite(patch.maxUses) || patch.maxUses < 1) return NextResponse.json({ error: 'maxUses must be >= 1' }, { status: 400 });
    }
    if (patch.startsAt && patch.endsAt && patch.endsAt <= patch.startsAt) {
      return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400 });
    }

    let row;
    try {
      [row] = await db
        .update(affiliateCodes)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(affiliateCodes.id, id))
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
      action: 'affiliate_code_updated',
      entityType: 'affiliate_code',
      entityId: id,
      message: 'Affiliate code updated',
      meta: { patch },
    });

    return NextResponse.json({ ok: true, data: row });
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
      .update(affiliateCodes)
      .set({ status: 'disabled', updatedAt: new Date() })
      .where(eq(affiliateCodes.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'affiliate_code_disabled',
      entityType: 'affiliate_code',
      entityId: id,
      message: 'Affiliate code disabled',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
