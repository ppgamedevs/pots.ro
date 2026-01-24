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
    await db.insert(rateLimits).values({ key, count: 1, resetAt: now + windowSeconds * 1000 })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, resetAt: now + windowSeconds * 1000 } });
    return false;
  }
  
  if (existing.count >= maxRequests) return true;
  
  await db.update(rateLimits).set({ count: sql`${rateLimits.count} + 1` }).where(eq(rateLimits.key, key));
  return false;
}

/**
 * Rotate Netopia keyset pointer
 * 
 * Since actual keys are stored in env vars (not in DB), this endpoint:
 * 1. Switches the active keyset pointer from "current" to "next"
 * 2. Expects NETOPIA_SIGNATURE_NEXT / NETOPIA_API_KEY_NEXT to be pre-provisioned
 * 3. Records the rotation in settings + audit log
 * 
 * This is the "best possible" rotation without storing secrets server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 2 rotations per day
    const rateLimitKey = `netopia-rotate-${user.id}`;
    const limited = await isRateLimited(rateLimitKey, 2, 86400);
    if (limited) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Max 2 rotations per day.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Require explicit confirmation
    if (body.confirm !== true) {
      return NextResponse.json(
        { ok: false, error: 'Key rotation requires explicit confirmation.' },
        { status: 400 }
      );
    }

    // Check if "next" env vars are provisioned
    const nextSignature = process.env.NETOPIA_SIGNATURE_NEXT;
    const nextApiKey = process.env.NETOPIA_API_KEY_NEXT;

    if (!nextSignature && !nextApiKey) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'No "next" keys provisioned. Set NETOPIA_SIGNATURE_NEXT and/or NETOPIA_API_KEY_NEXT in environment before rotating.' 
        },
        { status: 400 }
      );
    }

    // Get current keyset pointer
    let currentKeySet = 'current';
    try {
      const [keysetRow] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, 'netopia_active_keyset'))
        .limit(1);
      if (keysetRow?.value) {
        currentKeySet = keysetRow.value;
      }
    } catch {
      // First time rotation
    }

    // Switch keyset pointer
    const newKeySet = currentKeySet === 'current' ? 'next' : 'current';

    await db
      .insert(settings)
      .values({
        key: 'netopia_active_keyset',
        value: newKeySet,
        description: 'Active Netopia keyset pointer (current/next)',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: newKeySet,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });

    // Record rotation timestamp
    await db
      .insert(settings)
      .values({
        key: 'netopia_last_key_rotation',
        value: new Date().toISOString(),
        description: 'Last Netopia key rotation timestamp',
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: new Date().toISOString(),
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'netopia_key_rotation',
      entityType: 'integration',
      entityId: 'netopia',
      meta: {
        previousKeySet: currentKeySet,
        newKeySet,
        nextSignatureProvisioned: !!nextSignature,
        nextApiKeyProvisioned: !!nextApiKey,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Keyset rotated from "${currentKeySet}" to "${newKeySet}"`,
      activeKeySet: newKeySet,
      rotatedAt: new Date().toISOString(),
      note: 'Remember to update your primary env vars and remove the _NEXT suffix after verifying the rotation works.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
