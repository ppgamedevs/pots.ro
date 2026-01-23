import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/authz';
import { db } from '@/db';
import { featureFlags } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

const upsertSchema = z.object({
  key: z.string().min(1).max(200),
  enabled: z.boolean().optional(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
  segments: z
    .object({
      roles: z.array(z.string()).optional(),
      locales: z.array(z.string()).optional(),
      sellerIds: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);
    const rows = await db.query.featureFlags.findMany({ orderBy: desc(featureFlags.updatedAt) });
    return NextResponse.json({ flags: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Internal server error' : msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);
    const body = upsertSchema.parse(await req.json());

    const existing = await db.query.featureFlags.findFirst({ where: eq(featureFlags.key, body.key) });
    const next = {
      enabled: body.enabled ?? existing?.enabled ?? false,
      rolloutPct: body.rolloutPct ?? existing?.rolloutPct ?? 0,
      segments: body.segments ?? existing?.segments ?? null,
      updatedBy: user.id,
      updatedAt: new Date(),
    };

    await db
      .insert(featureFlags)
      .values({
        key: body.key,
        enabled: next.enabled,
        rolloutPct: next.rolloutPct,
        segments: next.segments,
        updatedBy: user.id,
        updatedAt: new Date(),
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: featureFlags.key,
        set: next,
      });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'feature_flag_upsert',
      entityType: 'feature_flag',
      entityId: body.key,
      message: `Updated feature flag ${body.key}`,
      meta: { enabled: next.enabled, rolloutPct: next.rolloutPct },
    });

    const row = await db.query.featureFlags.findFirst({ where: eq(featureFlags.key, body.key) });
    return NextResponse.json({ success: true, flag: row });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
