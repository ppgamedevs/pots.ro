import { db } from '@/db';
import { adminAuditLogs } from '@/db/schema/core';
import { desc } from 'drizzle-orm';
import crypto from 'node:crypto';

type AdminAuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  message?: string | null;
  meta?: any;
};

export async function writeAdminAudit(entry: AdminAuditInput) {
  try {
    const createdAt = new Date();

    // Best-effort tamper-evident chaining: not perfect under concurrency, but provides integrity checks.
    let prevHash: string | null = null;
    try {
      const [prev] = await db
        .select({ entryHash: adminAuditLogs.entryHash })
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(1);
      prevHash = (prev?.entryHash as any) ?? null;
    } catch {
      prevHash = null;
    }

    const canonical = JSON.stringify({
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      message: entry.message ?? null,
      meta: entry.meta ?? null,
      createdAt: createdAt.toISOString(),
    });
    const entryHash = crypto
      .createHash('sha256')
      .update(String(prevHash ?? ''))
      .update('|')
      .update(canonical)
      .digest('hex');

    await db.insert(adminAuditLogs).values({
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      message: entry.message ?? null,
      meta: entry.meta ?? null,
      prevHash,
      entryHash,
      createdAt,
    });
  } catch (err) {
    // Never block core action on audit failures.
    console.warn('[adminAudit] Failed to write audit log:', err);
  }
}
