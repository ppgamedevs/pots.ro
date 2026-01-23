import { db } from '@/db';
import { settings } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { type SettingKey, parseSettingValueToTyped } from './registry';

export type SettingRow = {
  key: string;
  value: string;
  stagedValue: string | null;
  stagedEffectiveAt: Date | null;
  stagedAt: Date | null;
  stagedBy: string | null;
  description: string | null;
  updatedAt: Date;
  updatedBy: string | null;
};

export async function getSettingRow(key: SettingKey): Promise<SettingRow | null> {
  const q = (db as any)?.query?.settings;
  if (!q?.findFirst) return null;

  const row = await q.findFirst({ where: eq(settings.key, key) });

  if (!row) return null;

  return {
    key: row.key,
    value: row.value,
    stagedValue: row.stagedValue ?? null,
    stagedEffectiveAt: row.stagedEffectiveAt ?? null,
    stagedAt: row.stagedAt ?? null,
    stagedBy: row.stagedBy ?? null,
    description: row.description ?? null,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy ?? null,
  };
}

export async function getSettingValueText(key: SettingKey): Promise<string | null> {
  const row = await getSettingRow(key);
  return row?.value ?? null;
}

export async function getSettingTyped<T>(key: SettingKey, fallback: T): Promise<T> {
  const raw = await getSettingValueText(key);
  if (!raw) return fallback;
  try {
    return parseSettingValueToTyped<T>(key, raw);
  } catch {
    return fallback;
  }
}

export async function getIntSetting(key: SettingKey, fallback: number): Promise<number> {
  return getSettingTyped<number>(key, fallback);
}

export async function getBoolSetting(key: SettingKey, fallback: boolean): Promise<boolean> {
  return getSettingTyped<boolean>(key, fallback);
}

export async function getJsonSetting<T>(key: SettingKey, fallback: T): Promise<T> {
  return getSettingTyped<T>(key, fallback);
}
