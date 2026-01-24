import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { db } from '@/db';
import { settings, rateLimits } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';

// Simple rate limit helper using resetAt schema
async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(eq(rateLimits.key, key));
  
  if (!existing || now > existing.resetAt) {
    // Window expired or first request - reset
    await db.insert(rateLimits).values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }
  
  if (existing.count >= maxRequests) return true;
  
  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 5 mode changes per hour
    const rateLimitKey = `netopia-mode-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 5, 3600);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const newMode = body.mode;

    if (newMode !== 'sandbox' && newMode !== 'production') {
      return NextResponse.json(
        { ok: false, error: 'Invalid mode. Must be "sandbox" or "production".' },
        { status: 400 }
      );
    }

    // Require confirmation for production switch
    if (newMode === 'production' && body.confirm !== true) {
      return NextResponse.json(
        { ok: false, error: 'Production mode requires explicit confirmation.' },
        { status: 400 }
      );
    }

    // Upsert the setting
    await db
      .insert(settings)
      .values({
        key: 'netopia_mode',
        value: newMode,
        description: 'Netopia payment gateway mode (sandbox/production)',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: newMode,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'netopia_mode_change',
      entityType: 'setting',
      entityId: 'netopia_mode',
      meta: { newMode, previousMode: body.previousMode ?? 'unknown' },
    });

    return NextResponse.json({
      ok: true,
      mode: newMode,
      message: `Netopia mode switched to ${newMode}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
