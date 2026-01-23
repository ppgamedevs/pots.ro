import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withPerformanceMonitoring } from "@/lib/api-wrapper";

import { db } from '@/db';
import { settings } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { isAllowedSettingKey, parseSettingValue, type SettingKey, SETTINGS_REGISTRY } from '@/lib/settings/registry';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  op: z.enum(['set', 'stage', 'apply', 'discard']).default('set'),
  key: z.string().min(1),
  value: z.any().optional(),
  description: z.string().optional(),
  stagedEffectiveAt: z.string().datetime().optional(),
  confirmDangerous: z.boolean().optional(),
});

/**
 * GET /api/admin/settings
 * Get all settings or a specific setting by key
 */
export const GET = withPerformanceMonitoring(async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      if (!isAllowedSettingKey(key)) {
        return NextResponse.json({ error: 'Unknown or forbidden setting key' }, { status: 400 });
      }

      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      if (!row) return NextResponse.json({ error: 'Setting not found' }, { status: 404 });

      return NextResponse.json({
        key: row.key,
        value: row.value,
        stagedValue: row.stagedValue ?? null,
        stagedEffectiveAt: row.stagedEffectiveAt ?? null,
        stagedAt: row.stagedAt ?? null,
        stagedBy: row.stagedBy ?? null,
        description: row.description ?? null,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy ?? null,
      });
    }

    // Return allowlisted settings only
    const rows = (await db.query.settings.findMany({
      orderBy: desc(settings.updatedAt),
    })) as any[];

    const allowlisted = rows.filter((r: any) => isAllowedSettingKey(r.key));

    return NextResponse.json({
      settings: allowlisted.map((r: any) => ({
        key: r.key,
        value: r.value,
        stagedValue: r.stagedValue ?? null,
        stagedEffectiveAt: r.stagedEffectiveAt ?? null,
        stagedAt: r.stagedAt ?? null,
        stagedBy: r.stagedBy ?? null,
        description: r.description ?? null,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy ?? null,
        dangerous: SETTINGS_REGISTRY[r.key as SettingKey]?.dangerous ?? false,
      })),
    });
  } catch (error) {
    logger.error("Error fetching settings", error instanceof Error ? error : new Error(String(error)), {
      component: 'api',
      endpoint: '/api/admin/settings',
      method: 'GET',
    });
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Internal server error' : msg }, { status });
  }
}, 'GET /api/admin/settings');

/**
 * POST /api/admin/settings
 * Update a setting
 */
export const POST = withPerformanceMonitoring(async function POST(request: NextRequest) {
  let body: any = null;
  try {
    const user = await requireRole(request, ['admin']);

    body = postSchema.parse(await request.json());
    const { op, key, value, description, stagedEffectiveAt, confirmDangerous } = body;

    if (!isAllowedSettingKey(key)) {
      return NextResponse.json({ error: 'Unknown or forbidden setting key' }, { status: 400 });
    }

    const entry = SETTINGS_REGISTRY[key];
    if (entry.dangerous && !confirmDangerous) {
      return NextResponse.json(
        { error: 'Dangerous setting key; set confirmDangerous=true to proceed' },
        { status: 400 }
      );
    }

    const actor = user.email || user.id;

    if (op === 'apply') {
      const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      if (!existing || !existing.stagedValue) {
        return NextResponse.json({ error: 'No staged value to apply' }, { status: 409 });
      }

      await db
        .update(settings)
        .set({
          value: existing.stagedValue,
          stagedValue: null,
          stagedEffectiveAt: null,
          stagedAt: null,
          stagedBy: null,
          updatedAt: new Date(),
          updatedBy: actor,
          description: description ?? existing.description,
        })
        .where(eq(settings.key, key));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'setting_applied',
        entityType: 'setting',
        entityId: key,
        message: `Applied staged value for ${key}`,
      });

      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      return NextResponse.json({ success: true, setting: row });
    }

    if (op === 'discard') {
      await db
        .update(settings)
        .set({ stagedValue: null, stagedEffectiveAt: null, stagedAt: null, stagedBy: null })
        .where(eq(settings.key, key));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'setting_staged_discarded',
        entityType: 'setting',
        entityId: key,
        message: `Discarded staged value for ${key}`,
      });

      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      return NextResponse.json({ success: true, setting: row });
    }

    if (value === undefined) {
      return NextResponse.json({ error: 'Value is required for set/stage' }, { status: 400 });
    }

    const valueText = parseSettingValue(key, value);

    if (op === 'stage') {
      const effectiveAt = stagedEffectiveAt ? new Date(stagedEffectiveAt) : null;
      await db
        .insert(settings)
        .values({
          key,
          value: valueText,
          description,
          stagedValue: valueText,
          stagedEffectiveAt: effectiveAt,
          stagedAt: new Date(),
          stagedBy: actor,
          updatedAt: new Date(),
          updatedBy: actor,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            description,
            stagedValue: valueText,
            stagedEffectiveAt: effectiveAt,
            stagedAt: new Date(),
            stagedBy: actor,
          },
        });

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'setting_staged',
        entityType: 'setting',
        entityId: key,
        message: `Staged setting ${key}`,
        meta: { effectiveAt: effectiveAt?.toISOString() ?? null },
      });

      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      return NextResponse.json({ success: true, setting: row });
    }

    // op === set
    await db
      .insert(settings)
      .values({
        key,
        value: valueText,
        description,
        updatedAt: new Date(),
        updatedBy: actor,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: valueText,
          description,
          updatedAt: new Date(),
          updatedBy: actor,
        },
      });

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'setting_updated',
      entityType: 'setting',
      entityId: key,
      message: `Updated setting ${key}`,
    });

    const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });

    return NextResponse.json({ success: true, setting: row });
  } catch (error) {
    logger.error("Error updating setting", error instanceof Error ? error : new Error(String(error)), {
      component: 'api',
      endpoint: '/api/admin/settings',
      method: 'POST',
      key: body?.key,
    });
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Internal server error' : msg }, { status });
  }
}, 'POST /api/admin/settings');

