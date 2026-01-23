import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/authz';
import { runRetentionPurge } from '@/lib/retention/purge';
import { writeAdminAudit } from '@/lib/admin/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  dryRun: z.boolean().optional(),
  reason: z.string().min(3).max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const retention = await runRetentionPurge({ dryRun: body.dryRun });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'retention.run',
      entityType: 'retention',
      entityId: 'run',
      message: retention.dryRun ? 'Ran retention purge (dry-run)' : 'Ran retention purge',
      meta: {
        dryRun: retention.dryRun,
        reason: body.reason,
        results: retention.results.map((r) => ({
          table: r.table,
          days: r.days,
          candidateCount: r.candidateCount,
          deletedCount: r.deletedCount,
          error: r.error,
        })),
      },
    });

    return NextResponse.json({ ok: true, retention });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
