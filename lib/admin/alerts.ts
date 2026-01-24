/**
 * Admin Alerts Library
 * Helper functions for creating and managing admin alerts
 */

import { db } from "@/db";
import { adminAlerts } from "@/db/schema/core";
import { eq, and, inArray, sql, lte } from "drizzle-orm";

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertSource =
  | "webhook_failure"
  | "payment_error"
  | "payout_error"
  | "refund_error"
  | "stock_negative"
  | "seller_suspended"
  | "message_spike"
  | "security_event";

export interface CreateAlertInput {
  source: AlertSource;
  type: string; // sub-type, e.g., 'netopia_timeout', 'stripe_declined'
  severity: AlertSeverity;
  dedupeKey: string; // unique per open alert
  entityType?: string; // 'order', 'product', 'seller', 'webhook', etc.
  entityId?: string;
  title: string;
  details?: Record<string, unknown>;
}

/**
 * Create a new alert or return existing if dedupeKey already has an active alert
 * Uses upsert with partial unique index to prevent duplicates
 */
export async function createAlert(input: CreateAlertInput): Promise<{ id: string; isNew: boolean }> {
  try {
    // Try to find existing active alert with same dedupe key
    const [existing] = await db
      .select({ id: adminAlerts.id })
      .from(adminAlerts)
      .where(
        and(
          eq(adminAlerts.dedupeKey, input.dedupeKey),
          inArray(adminAlerts.status, ["open", "acknowledged", "snoozed"])
        )
      )
      .limit(1);

    if (existing) {
      // Update the existing alert's details (append context)
      const [updated] = await db
        .update(adminAlerts)
        .set({
          details: sql`${adminAlerts.details} || ${JSON.stringify({
            lastOccurrence: new Date().toISOString(),
            ...input.details,
          })}::jsonb`,
          updatedAt: new Date(),
        })
        .where(eq(adminAlerts.id, existing.id))
        .returning({ id: adminAlerts.id });

      return { id: updated?.id ?? existing.id, isNew: false };
    }

    // Create new alert
    const [newAlert] = await db
      .insert(adminAlerts)
      .values({
        source: input.source,
        type: input.type,
        severity: input.severity,
        dedupeKey: input.dedupeKey,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        title: input.title,
        details: input.details ?? {},
        status: "open",
      })
      .returning({ id: adminAlerts.id });

    return { id: newAlert.id, isNew: true };
  } catch (error) {
    // Handle race condition where alert was created between check and insert
    if ((error as any)?.code === "23505") {
      // Unique violation - find and return existing
      const [existing] = await db
        .select({ id: adminAlerts.id })
        .from(adminAlerts)
        .where(
          and(
            eq(adminAlerts.dedupeKey, input.dedupeKey),
            inArray(adminAlerts.status, ["open", "acknowledged", "snoozed"])
          )
        )
        .limit(1);

      if (existing) {
        return { id: existing.id, isNew: false };
      }
    }
    throw error;
  }
}

/**
 * Bulk create alerts (for cron jobs like negative stock check)
 */
export async function createAlertsBulk(inputs: CreateAlertInput[]): Promise<{ created: number; deduplicated: number }> {
  let created = 0;
  let deduplicated = 0;

  for (const input of inputs) {
    try {
      const result = await createAlert(input);
      if (result.isNew) {
        created++;
      } else {
        deduplicated++;
      }
    } catch (error) {
      console.error(`Failed to create alert for ${input.dedupeKey}:`, error);
    }
  }

  return { created, deduplicated };
}

/**
 * Reopen snoozed alerts that have expired
 * Should be called periodically (e.g., every minute)
 */
export async function reopenExpiredSnoozedAlerts(): Promise<number> {
  const result = await db
    .update(adminAlerts)
    .set({
      status: "open",
      snoozedUntil: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(adminAlerts.status, "snoozed"),
        lte(adminAlerts.snoozedUntil, new Date())
      )
    )
    .returning({ id: adminAlerts.id });

  return result.length;
}

/**
 * Get active alert counts by severity
 */
export async function getActiveAlertCounts(): Promise<{
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}> {
  const [counts] = await db
    .select({
      critical: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'critical')::int`,
      high: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'high')::int`,
      medium: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'medium')::int`,
      low: sql<number>`count(*) filter (where ${adminAlerts.severity} = 'low')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(adminAlerts)
    .where(inArray(adminAlerts.status, ["open", "acknowledged"]));

  return {
    critical: counts?.critical ?? 0,
    high: counts?.high ?? 0,
    medium: counts?.medium ?? 0,
    low: counts?.low ?? 0,
    total: counts?.total ?? 0,
  };
}

/**
 * Auto-resolve alert when underlying issue is fixed
 */
export async function autoResolveAlert(dedupeKey: string, resolvedByUserId?: string): Promise<boolean> {
  const result = await db
    .update(adminAlerts)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedByUserId: resolvedByUserId ?? null,
      updatedAt: new Date(),
      details: sql`${adminAlerts.details} || '{"autoResolved": true}'::jsonb`,
    })
    .where(
      and(
        eq(adminAlerts.dedupeKey, dedupeKey),
        inArray(adminAlerts.status, ["open", "acknowledged", "snoozed"])
      )
    )
    .returning({ id: adminAlerts.id });

  return result.length > 0;
}
