import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function resolveSellerId(identifier: string): Promise<string | null> {
  const raw = (identifier || '').trim();
  if (!raw) return null;

  if (looksLikeUuid(raw)) return raw;

  const [row] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.slug, raw))
    .limit(1);

  return row?.id ?? null;
}
