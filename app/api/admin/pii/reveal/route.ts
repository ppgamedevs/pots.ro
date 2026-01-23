import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { authAudit, adminPiiGrants } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { getClientIP, getUserAgent } from '@/lib/auth/crypto';
import { getIntSetting } from '@/lib/settings/store';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  entityType: z.literal('auth_audit'),
  entityId: z.string().min(1),
  fields: z.array(z.enum(['email'])).min(1),
  reason: z.string().min(5).max(500),
  ttlMinutes: z.number().int().min(1).max(60).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);
    const body = schema.parse(await req.json());

    const ip = getClientIP(req.headers);
    const ua = getUserAgent(req.headers);

    // Fetch the record (masked elsewhere by default; reveal is explicit + audited)
    const [row] = await db
      .select({ id: authAudit.id, email: authAudit.email })
      .from(authAudit)
      .where(eq(authAudit.id, body.entityId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ttl = body.ttlMinutes ?? (await getIntSetting('security.pii_reveal_ttl_minutes', 10));
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const [grant] = await db
      .insert(adminPiiGrants)
      .values({
        actorId: actor.id,
        entityType: body.entityType,
        entityId: body.entityId,
        fields: body.fields,
        reason: body.reason,
        expiresAt,
        createdAt: new Date(),
      })
      .returning({ id: adminPiiGrants.id, expiresAt: adminPiiGrants.expiresAt });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'pii.reveal',
      entityType: body.entityType,
      entityId: body.entityId,
      message: 'PII reveal granted',
      meta: {
        ip,
        ua,
        fields: body.fields,
        reason: body.reason,
        ttlMinutes: ttl,
        grantId: grant?.id,
      },
    });

    const revealed: Record<string, any> = {};
    if (body.fields.includes('email')) revealed.email = row.email;

    return NextResponse.json({
      grantId: grant?.id,
      expiresAt: grant?.expiresAt?.toISOString?.() ?? null,
      revealed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
