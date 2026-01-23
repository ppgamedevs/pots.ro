import { db } from '@/db';
import { sql } from 'drizzle-orm';

import { getBoolSetting, getIntSetting } from '@/lib/settings/store';

export type RetentionPurgeItem = {
  table: string;
  days: number;
  cutoffIso: string;
  candidateCount: number;
  deletedCount: number;
  dryRun: boolean;
  skipped: boolean;
  error?: string;
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function purgeByCreatedAt(opts: {
  table: string;
  createdAtColumn: string;
  days: number;
  dryRun: boolean;
}): Promise<RetentionPurgeItem> {
  const cutoff = daysAgo(opts.days);

  try {
    const countRes = await db.execute(sql`
      SELECT count(*)::int as count
      FROM ${sql.raw(opts.table)}
      WHERE ${sql.raw(opts.createdAtColumn)} < ${cutoff}
    `);

    const candidateCount = Number((countRes as any)?.rows?.[0]?.count ?? 0);

    if (opts.dryRun || candidateCount === 0) {
      return {
        table: opts.table,
        days: opts.days,
        cutoffIso: cutoff.toISOString(),
        candidateCount,
        deletedCount: 0,
        dryRun: opts.dryRun,
        skipped: true,
      };
    }

    const delRes = await db.execute(sql`
      DELETE FROM ${sql.raw(opts.table)}
      WHERE ${sql.raw(opts.createdAtColumn)} < ${cutoff}
    `);

    const deletedCount = Number((delRes as any)?.rowCount ?? 0);

    return {
      table: opts.table,
      days: opts.days,
      cutoffIso: cutoff.toISOString(),
      candidateCount,
      deletedCount,
      dryRun: opts.dryRun,
      skipped: false,
    };
  } catch (err) {
    return {
      table: opts.table,
      days: opts.days,
      cutoffIso: cutoff.toISOString(),
      candidateCount: 0,
      deletedCount: 0,
      dryRun: opts.dryRun,
      skipped: true,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function runRetentionPurge(input?: { dryRun?: boolean }) {
  const dryRunSetting = await getBoolSetting('retention.dry_run', false);
  const dryRun = input?.dryRun ?? dryRunSetting;

  // Defaults match previous hard-coded behavior.
  const webhookLogsDays = await getIntSetting('retention.webhook_logs_days', 90);
  const emailEventsDays = await getIntSetting('retention.email_events_days', 90);
  const eventsRawDays = await getIntSetting('retention.events_raw_days', 30);

  // Off by default unless explicitly configured.
  const messagesDays = await getIntSetting('retention.messages_days', 0);
  const supportConversationMessagesDays = await getIntSetting('retention.support_conversation_messages_days', 0);
  const supportTicketMessagesDays = await getIntSetting('retention.support_ticket_messages_days', 0);

  const items: Array<{ table: string; createdAtColumn: string; days: number }> = [
    { table: 'webhook_logs', createdAtColumn: 'created_at', days: webhookLogsDays },
    { table: 'email_events', createdAtColumn: 'created_at', days: emailEventsDays },
    { table: 'events_raw', createdAtColumn: 'created_at', days: eventsRawDays },
  ];

  if (messagesDays > 0) items.push({ table: 'messages', createdAtColumn: 'created_at', days: messagesDays });
  if (supportConversationMessagesDays > 0)
    items.push({ table: 'support_conversation_messages', createdAtColumn: 'created_at', days: supportConversationMessagesDays });
  if (supportTicketMessagesDays > 0)
    items.push({ table: 'support_ticket_messages', createdAtColumn: 'created_at', days: supportTicketMessagesDays });

  const results: RetentionPurgeItem[] = [];

  for (const item of items) {
    if (item.days <= 0) continue;
    results.push(
      await purgeByCreatedAt({
        table: item.table,
        createdAtColumn: item.createdAtColumn,
        days: item.days,
        dryRun,
      })
    );
  }

  return {
    dryRun,
    results,
  };
}
