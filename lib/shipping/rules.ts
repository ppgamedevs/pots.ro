import { z } from 'zod';
import { getJsonSetting, getIntSetting } from '@/lib/settings/store';
import { type ShippingRulesV1 } from '@/lib/settings/registry';

const DEFAULT_RULES: ShippingRulesV1 = {
  version: 1,
  baseFeeCents: 1999,
  freeThresholdCents: 0,
  perKgFeeCents: 150,
  tiers: undefined,
  sellerOverrides: undefined,
  categoryOverrides: undefined,
};

const ShippingRulesStoredSchema = z.object({
  version: z.literal(1),
  baseFeeCents: z.number().int().min(0),
  freeThresholdCents: z.number().int().min(0),
  perKgFeeCents: z.number().int().min(0).optional(),
  tiers: z
    .array(
      z.object({
        minSubtotalCents: z.number().int().min(0).optional(),
        maxSubtotalCents: z.number().int().min(0).optional(),
        feeCents: z.number().int().min(0),
      })
    )
    .optional(),
  sellerOverrides: z
    .array(
      z.object({
        sellerId: z.string().min(1),
        baseFeeCents: z.number().int().min(0).optional(),
        freeThresholdCents: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  categoryOverrides: z
    .array(
      z.object({
        categorySlug: z.string().min(1),
        baseFeeCents: z.number().int().min(0).optional(),
        freeThresholdCents: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

export type ComputeShippingInput = {
  netSubtotalCents: number;
  weightKg?: number;
  sellerId?: string | null;
  categorySlugs?: string[];
};

export async function getShippingRules(): Promise<ShippingRulesV1> {
  // Back-compat: if shipping.rules_json is absent, build from old simple keys.
  const rules = await getJsonSetting<ShippingRulesV1 | null>('shipping.rules_json', null);
  if (rules) {
    const parsed = ShippingRulesStoredSchema.safeParse(rules);
    if (parsed.success) return parsed.data;
  }

  // Prefer the newer key; fall back to legacy shipping_fee_cents if present.
  const legacyFee = await getIntSetting('shipping_fee_cents', 0);
  const baseFee = await getIntSetting('shipping.base_fee_cents', legacyFee > 0 ? legacyFee : DEFAULT_RULES.baseFeeCents);
  const freeThreshold = await getIntSetting('shipping.free_threshold_cents', DEFAULT_RULES.freeThresholdCents);
  const perKgFee = await getIntSetting('shipping.per_kg_fee_cents', DEFAULT_RULES.perKgFeeCents ?? 0);

  return {
    version: 1,
    baseFeeCents: Math.max(0, baseFee),
    freeThresholdCents: Math.max(0, freeThreshold),
    perKgFeeCents: Math.max(0, perKgFee),
  };
}

function pickTierFee(
  tiers: ShippingRulesV1['tiers'] | undefined,
  netSubtotalCents: number
): number | null {
  if (!tiers || tiers.length === 0) return null;

  for (const tier of tiers) {
    const minOk = tier.minSubtotalCents == null || netSubtotalCents >= tier.minSubtotalCents;
    const maxOk = tier.maxSubtotalCents == null || netSubtotalCents <= tier.maxSubtotalCents;
    if (minOk && maxOk) return tier.feeCents;
  }

  return null;
}

export async function computeShippingFeeCents(input: ComputeShippingInput): Promise<number> {
  const rules = await getShippingRules();

  const netSubtotalCents = Math.max(0, Math.floor(input.netSubtotalCents || 0));
  const weightKg = Math.max(0, Number.isFinite(input.weightKg) ? Number(input.weightKg) : 1);

  let baseFeeCents = rules.baseFeeCents;
  let freeThresholdCents = rules.freeThresholdCents;

  // Seller override
  if (input.sellerId && rules.sellerOverrides?.length) {
    const override = rules.sellerOverrides.find((o) => o.sellerId === input.sellerId);
    if (override?.baseFeeCents != null) baseFeeCents = override.baseFeeCents;
    if (override?.freeThresholdCents != null) freeThresholdCents = override.freeThresholdCents;
  }

  // Category overrides (pick the most permissive / lowest fee among matched)
  const slugs = (input.categorySlugs || []).filter(Boolean);
  if (slugs.length && rules.categoryOverrides?.length) {
    const matches = rules.categoryOverrides.filter((o) => slugs.includes(o.categorySlug));
    if (matches.length) {
      const matchedBaseFees = matches.map((m) => m.baseFeeCents).filter((v): v is number => typeof v === 'number');
      const matchedThresholds = matches.map((m) => m.freeThresholdCents).filter((v): v is number => typeof v === 'number');
      if (matchedBaseFees.length) baseFeeCents = Math.min(baseFeeCents, ...matchedBaseFees);
      if (matchedThresholds.length) freeThresholdCents = Math.min(freeThresholdCents, ...matchedThresholds);
    }
  }

  // Tiered override by subtotal
  const tierFee = pickTierFee(rules.tiers, netSubtotalCents);
  let feeCents = tierFee != null ? tierFee : baseFeeCents;

  // Optional per-kg fee (simple MVP rule)
  const perKgFeeCents = rules.perKgFeeCents ?? 0;
  if (perKgFeeCents > 0) {
    const excessWeight = Math.max(0, weightKg - 1);
    feeCents += Math.round(excessWeight * perKgFeeCents);
  }

  // Free shipping
  if (freeThresholdCents > 0 && netSubtotalCents >= freeThresholdCents) {
    feeCents = 0;
  }

  return Math.max(0, Math.floor(feeCents));
}
