import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { emailService } from '@/lib/email';
import React from 'react';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  note: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { id } = await params;
    const { note } = schema.parse(await req.json());

    const row = await db.query.webhookLogs.findFirst({ where: eq(webhookLogs.id, id) });
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_escalated',
      entityType: 'webhook_log',
      entityId: id,
      message: 'Escalated webhook issue',
      meta: { source: row.source, ref: row.ref, result: row.result, note },
    });

    const recipients = (process.env.ADMIN_EMAILS || 'admin@floristmarket.ro')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const to of recipients) {
      await emailService.sendEmail({
        to,
        subject: `🚨 Webhook escalated (${row.source})`,
        template: React.createElement(
          'div',
          { style: { fontFamily: 'Arial, sans-serif', maxWidth: '640px', margin: '0 auto', padding: '16px' } },
          [
            React.createElement('h2', { key: 'h2' }, 'Webhook escalation'),
            React.createElement('p', { key: 'id' }, `Webhook log id: ${id}`),
            React.createElement('p', { key: 'source' }, `Source: ${row.source}`),
            React.createElement('p', { key: 'ref' }, `Ref: ${row.ref || '-'}`),
            React.createElement('p', { key: 'result' }, `Result: ${row.result || '-'}`),
            React.createElement('p', { key: 'note' }, `Note: ${note}`),
          ]
        ),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
