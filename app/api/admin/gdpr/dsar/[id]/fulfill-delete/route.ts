import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprDsrRequests, gdprPreferences, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);
    const requestId = ctx.params.id;
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const [dsar] = await db
      .select({
        id: gdprDsrRequests.id,
        type: gdprDsrRequests.type,
        status: gdprDsrRequests.status,
        email: gdprDsrRequests.email,
        emailMasked: gdprDsrRequests.emailMasked,
        emailHash: gdprDsrRequests.emailHash,
        verifiedAt: gdprDsrRequests.verifiedAt,
      })
      .from(gdprDsrRequests)
      .where(eq(gdprDsrRequests.id, requestId))
      .limit(1);

    if (!dsar) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dsar.type !== 'delete') return NextResponse.json({ error: 'Not a delete request' }, { status: 400 });
    if (!dsar.verifiedAt) return NextResponse.json({ error: 'Request not verified yet' }, { status: 409 });

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, dsar.email))
      .limit(1);

    let userDeleted = false;

    if (user) {
      const anonymizedEmail = `deleted_${user.id}_${Date.now()}@deleted.local`;
      await db
        .update(users)
        .set({
          email: anonymizedEmail,
          name: null,
          password: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      userDeleted = true;
    }

    // Remove current GDPR preferences tied to the email (if any)
    await db.delete(gdprPreferences).where(eq(gdprPreferences.email, dsar.email));

    await db
      .update(gdprDsrRequests)
      .set({
        status: 'fulfilled',
        handledBy: actor.id,
        completedAt: new Date(),
        meta: {
          delete: {
            userFound: !!user,
            userDeleted,
          },
        },
      })
      .where(eq(gdprDsrRequests.id, requestId));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'gdpr.dsar.delete_fulfilled',
      entityType: 'gdpr_dsr_request',
      entityId: requestId,
      message: `Fulfilled DSAR delete for ${dsar.emailMasked || dsar.emailHash}`,
      meta: {
        type: dsar.type,
        emailHash: dsar.emailHash,
        userFound: !!user,
        userDeleted,
        reason: body.reason,
      },
    });

    return NextResponse.json({ ok: true, userDeleted });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
