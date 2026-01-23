import { db } from '@/db';
import { featureFlags } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { getBoolSetting } from '@/lib/settings/store';

export type FlagContext = {
  userId?: string | null;
  role?: string | null;
  locale?: string | null;
  sellerId?: string | null;
};

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  rolloutPct: number;
  segments: any;
};

type FeatureFlagSelect = {
  key: string;
  enabled: boolean;
  rolloutPct: number;
  segments: any;
};

function stableBucket(userId: string, flagKey: string): number {
  const h = crypto.createHash('sha256').update(`${flagKey}:${userId}`).digest('hex');
  // Take first 8 hex chars => 32-bit
  const n = parseInt(h.slice(0, 8), 16);
  return n % 100;
}

export function isEnabledRow(row: FeatureFlagRow, ctx: FlagContext): boolean {
  if (!row.enabled) return false;

  const segments = row.segments as any;
  if (segments) {
    if (Array.isArray(segments.roles) && ctx.role && !segments.roles.includes(ctx.role)) return false;
    if (Array.isArray(segments.locales) && ctx.locale && !segments.locales.includes(ctx.locale)) return false;
    if (Array.isArray(segments.sellerIds) && ctx.sellerId && !segments.sellerIds.includes(ctx.sellerId)) return false;
  }

  const pct = Math.max(0, Math.min(100, Number(row.rolloutPct || 0)));
  if (pct >= 100) return true;
  if (pct <= 0) return false;

  if (!ctx.userId) return false;
  return stableBucket(ctx.userId, row.key) < pct;
}

export async function isFeatureEnabled(key: string, ctx: FlagContext): Promise<boolean> {
  const killSwitch = await getBoolSetting('feature_flags.global_kill_switch', false);
  if (killSwitch) return false;

  const found = (await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1)) as FeatureFlagSelect[];
  const row = found[0];
  if (!row) return false;

  return isEnabledRow(
    {
      key: row.key,
      enabled: row.enabled,
      rolloutPct: row.rolloutPct,
      segments: row.segments,
    },
    ctx
  );
}

export async function listFlags(): Promise<FeatureFlagRow[]> {
  const killSwitch = await getBoolSetting('feature_flags.global_kill_switch', false);
  if (killSwitch) return [];

  const rows = (await db.select().from(featureFlags).orderBy(desc(featureFlags.updatedAt))) as FeatureFlagSelect[];

  return rows.map((r: FeatureFlagSelect) => ({
    key: r.key,
    enabled: r.enabled,
    rolloutPct: r.rolloutPct,
    segments: r.segments,
  }));
}
