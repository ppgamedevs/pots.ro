import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { emailSuppressions } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const addSchema = z
  .object({
    email: z.string().email(),
    reason: z.enum(['bounce', 'complaint', 'manual', 'unsubscribe']),
    note: z.string().max(1000).optional(),
  })
  .strict();

const revokeSchema = z
  .object({
    email: z.string().email(),
    note: z.string().max(1000).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const onlyActive = url.searchParams.get('active') === '1';

    const conditions = [] as any[];
    if (q) conditions.push(sql`lower(${emailSuppressions.email}) like ${'%' + q + '%'}`);
    if (onlyActive) conditions.push(isNull(emailSuppressions.revokedAt));

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select({
        email: emailSuppressions.email,
        reason: emailSuppressions.reason,
        source: emailSuppressions.source,
        note: emailSuppressions.note,
        createdBy: emailSuppressions.createdBy,
        createdAt: emailSuppressions.createdAt,
        revokedAt: emailSuppressions.revokedAt,
        revokedBy: emailSuppressions.revokedBy,
        updatedAt: emailSuppressions.updatedAt,
      })
      .from(emailSuppressions)
      .where(where)
      .orderBy(desc(emailSuppressions.updatedAt))
      .limit(200);

    return NextResponse.json({ q, active: onlyActive, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const parsed = addSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const now = new Date();
    const email = parsed.data.email.toLowerCase();

    await db
      .insert(emailSuppressions)
      .values({
        email,
        reason: parsed.data.reason,
        source: 'admin',
        note: parsed.data.note || null,
        createdBy: actor.id,
        createdAt: now,
        updatedAt: now,
        revokedAt: null,
        revokedBy: null,
      } as any)
      .onConflictDoUpdate({
        target: emailSuppressions.email,
        set: {
          reason: parsed.data.reason,
          source: 'admin',
          note: parsed.data.note || null,
          createdBy: actor.id,
          revokedAt: null,
          revokedBy: null,
          updatedAt: now,
        } as any,
      });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'email_suppression_add',
      entityType: 'email_suppression',
      entityId: email,
      meta: { reason: parsed.data.reason, note: parsed.data.note || null },
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const now = new Date();
    const email = parsed.data.email.toLowerCase();

    const [updated] = await db
      .update(emailSuppressions)
      .set({
        revokedAt: now,
        revokedBy: actor.id,
        note: parsed.data.note || null,
        updatedAt: now,
      })
      .where(eq(emailSuppressions.email, email))
      .returning({ email: emailSuppressions.email });

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'email_suppression_revoke',
      entityType: 'email_suppression',
      entityId: email,
      meta: { note: parsed.data.note || null },
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
