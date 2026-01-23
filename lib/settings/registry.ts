import { z } from 'zod';

export type SettingKey =
  | 'shipping_fee_cents' // legacy
  | 'shipping.base_fee_cents'
  | 'shipping.free_threshold_cents'
  | 'shipping.per_kg_fee_cents'
  | 'shipping.rules_json'
  | 'feature_flags.global_kill_switch'
  | 'notifications.admin_emails_json'
  | 'abuse.allowed_ips_json'
  | 'abuse.blocked_ips_json'
  | 'abuse.challenge_ips_json'
  | 'abuse.blocked_email_domains_json'
  | 'security.pii_reveal_ttl_minutes';

export type SettingRegistryEntry = {
  key: SettingKey;
  description: string;
  dangerous?: boolean;
  schema: z.ZodTypeAny;
};

const shippingRulesV1Schema = z.object({
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

export type ShippingRulesV1 = z.infer<typeof shippingRulesV1Schema>;

export const SETTINGS_REGISTRY: Record<SettingKey, SettingRegistryEntry> = {
  shipping_fee_cents: {
    key: 'shipping_fee_cents',
    description: 'Legacy shipping fee in cents (RON). Prefer shipping.base_fee_cents.',
    schema: z.string().regex(/^\d+$/),
  },
  'shipping.base_fee_cents': {
    key: 'shipping.base_fee_cents',
    description: 'Base shipping fee in cents (RON).',
    schema: z.number().int().min(0).max(5_000_000),
  },
  'shipping.free_threshold_cents': {
    key: 'shipping.free_threshold_cents',
    description: 'Free shipping threshold in cents (RON). 0 disables free shipping.',
    schema: z.number().int().min(0).max(500_000_000),
  },
  'shipping.per_kg_fee_cents': {
    key: 'shipping.per_kg_fee_cents',
    description: 'Per-kg fee (cents) over 1kg for shipping quote endpoint.',
    schema: z.number().int().min(0).max(500_000),
  },
  'shipping.rules_json': {
    key: 'shipping.rules_json',
    description: 'Shipping rules JSON (v1): tiers + per-seller/per-category overrides.',
    dangerous: true,
    schema: shippingRulesV1Schema,
  },
  'feature_flags.global_kill_switch': {
    key: 'feature_flags.global_kill_switch',
    description: 'Emergency kill switch for all feature flags (true disables all flags).',
    dangerous: true,
    schema: z.boolean(),
  },
  'notifications.admin_emails_json': {
    key: 'notifications.admin_emails_json',
    description: 'Admin alert recipients as JSON array of emails. Falls back to ADMIN_EMAILS env var.',
    dangerous: true,
    schema: z.array(z.string().email()).min(1),
  },
  'abuse.allowed_ips_json': {
    key: 'abuse.allowed_ips_json',
    description: 'Allowlist IPs that bypass rate limiting (use sparingly).',
    dangerous: true,
    schema: z.array(z.string().min(1)).default([]),
  },
  'abuse.blocked_ips_json': {
    key: 'abuse.blocked_ips_json',
    description: 'Blocklist IPs (immediate 429).',
    dangerous: true,
    schema: z.array(z.string().min(1)).default([]),
  },
  'abuse.challenge_ips_json': {
    key: 'abuse.challenge_ips_json',
    description: 'Challenge IPs (stricter limits + small jitter).',
    dangerous: true,
    schema: z.array(z.string().min(1)).default([]),
  },
  'abuse.blocked_email_domains_json': {
    key: 'abuse.blocked_email_domains_json',
    description: 'Blocked email domains (for OTP/login flows).',
    dangerous: true,
    schema: z.array(z.string().min(1)).default([]),
  },
  'security.pii_reveal_ttl_minutes': {
    key: 'security.pii_reveal_ttl_minutes',
    description: 'Default TTL (minutes) for PII reveal grants.',
    dangerous: true,
    schema: z.number().int().min(1).max(60),
  },
};

export function isAllowedSettingKey(key: string): key is SettingKey {
  return key in SETTINGS_REGISTRY;
}

export function parseSettingValue(key: SettingKey, raw: unknown): string {
  const entry = SETTINGS_REGISTRY[key];

  // For storage, we persist everything as text; numbers/bools/json are stringified.
  if (entry.schema instanceof z.ZodString) {
    return entry.schema.parse(raw);
  }

  if (entry.schema instanceof z.ZodNumber) {
    return String(entry.schema.parse(raw));
  }

  if (entry.schema instanceof z.ZodBoolean) {
    return entry.schema.parse(raw) ? 'true' : 'false';
  }

  // JSON-like schemas
  return JSON.stringify(entry.schema.parse(raw));
}

export function parseSettingValueToTyped<T>(key: SettingKey, rawText: string): T {
  const entry = SETTINGS_REGISTRY[key];

  if (entry.schema instanceof z.ZodString) {
    return entry.schema.parse(rawText) as T;
  }

  if (entry.schema instanceof z.ZodNumber) {
    return entry.schema.parse(Number(rawText)) as T;
  }

  if (entry.schema instanceof z.ZodBoolean) {
    return entry.schema.parse(rawText === 'true') as T;
  }

  return entry.schema.parse(JSON.parse(rawText)) as T;
}
