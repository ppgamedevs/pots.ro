import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { id } = await params;

    const existing = await db.query.webhookLogs.findFirst({ where: eq(webhookLogs.id, id) });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.update(webhookLogs).set({ result: 'duplicate' }).where(eq(webhookLogs.id, id));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_mark_duplicate',
      entityType: 'webhook_log',
      entityId: id,
      message: 'Marked webhook log as duplicate',
      meta: { source: existing.source, ref: existing.ref },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
