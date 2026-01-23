import { db } from '@/db';
import { commissionRates } from '@/db/schema/core';
import { COMMISSION_PCT } from '@/lib/env';
import { and, desc, eq, isNull, lte } from 'drizzle-orm';

/**
 * Returns effective commission rate (basis points) for seller.
 * Uses approved commission_rates with effectiveAt <= now.
 */
export async function getEffectiveCommissionPct(sellerId?: string | null): Promise<number> {
  const now = new Date();

  if (sellerId) {
    const sellerSpecific = await db
      .select()
      .from(commissionRates)
      .where(and(eq(commissionRates.status, 'approved'), eq(commissionRates.sellerId, sellerId), lte(commissionRates.effectiveAt, now)))
      .orderBy(desc(commissionRates.effectiveAt))
      .limit(1);

    if (sellerSpecific[0]?.pctBps != null) return Number(sellerSpecific[0].pctBps);
  }

  const defaults = await db
    .select()
    .from(commissionRates)
    .where(and(eq(commissionRates.status, 'approved'), isNull(commissionRates.sellerId), lte(commissionRates.effectiveAt, now)))
    .orderBy(desc(commissionRates.effectiveAt))
    .limit(1);

  if (defaults[0]?.pctBps != null) return Number(defaults[0].pctBps);
  return COMMISSION_PCT;
}
