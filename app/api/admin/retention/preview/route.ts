import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/authz';
import { runRetentionPurge } from '@/lib/retention/purge';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const retention = await runRetentionPurge({ dryRun: true });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'retention.preview',
      entityType: 'retention',
      entityId: 'preview',
      message: 'Previewed retention purge (dry-run)',
      meta: {
        dryRun: true,
        results: retention.results.map((r) => ({
          table: r.table,
          days: r.days,
          candidateCount: r.candidateCount,
          error: r.error,
        })),
      },
    });

    return NextResponse.json({ ok: true, retention });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
