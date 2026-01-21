import { db } from '@/db';
import { adminAuditLogs } from '@/db/schema/core';

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
    await db.insert(adminAuditLogs).values({
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      message: entry.message ?? null,
      meta: entry.meta ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    // Never block core action on audit failures.
    console.warn('[adminAudit] Failed to write audit log:', err);
  }
}
