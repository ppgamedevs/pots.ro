import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { redactWebhookPayload } from '@/lib/webhook-logging';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, ['admin', 'support']);
    const { id } = await params;

    const row = await db.query.webhookLogs.findFirst({ where: eq(webhookLogs.id, id) });
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ...row, payload: redactWebhookPayload(row.payload) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
