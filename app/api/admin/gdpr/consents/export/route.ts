import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprConsentEvents, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { hashEmailSha256 } from '@/lib/compliance/gdpr';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const url = new URL(req.url);
    const email = (url.searchParams.get('email') || '').trim();
    const q = (url.searchParams.get('q') || '').trim();
    const from = (url.searchParams.get('from') || '').trim();
    const to = (url.searchParams.get('to') || '').trim();

    if (!email && !q && !from && !to) {
      return NextResponse.json(
        { error: 'Provide at least one filter (email, q, from, to) before exporting.' },
        { status: 400 }
      );
    }

    const conditions: any[] = [];

    if (email) {
      conditions.push(eq(gdprConsentEvents.emailHash, hashEmailSha256(email)));
    }

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(gdprConsentEvents.createdAt, d));
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(gdprConsentEvents.createdAt, d));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(gdprConsentEvents.emailDomain, search),
          ilike(gdprConsentEvents.emailMasked, search),
          ilike(gdprConsentEvents.policyVersion, search),
          ilike(gdprConsentEvents.legalBasis, search)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows: Array<{
      createdAt: Date;
      emailHash: string;
      emailDomain: string | null;
      emailMasked: string | null;
      consentType: string;
      legalBasis: string;
      source: string;
      policyVersion: string | null;
      actorId: string | null;
      actorEmail: string | null;
      ip: string | null;
      userAgent: string | null;
    }> = await db
      .select({
        createdAt: gdprConsentEvents.createdAt,
        emailHash: gdprConsentEvents.emailHash,
        emailDomain: gdprConsentEvents.emailDomain,
        emailMasked: gdprConsentEvents.emailMasked,
        consentType: gdprConsentEvents.consentType,
        legalBasis: gdprConsentEvents.legalBasis,
        source: gdprConsentEvents.source,
        policyVersion: gdprConsentEvents.policyVersion,
        actorId: gdprConsentEvents.actorId,
        actorEmail: users.email,
        ip: gdprConsentEvents.ip,
        userAgent: gdprConsentEvents.userAgent,
      })
      .from(gdprConsentEvents)
      .leftJoin(users, eq(gdprConsentEvents.actorId, users.id))
      .where(where)
      .orderBy(desc(gdprConsentEvents.createdAt))
      .limit(5000);

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'gdpr.consent.export',
      entityType: 'gdpr_consent',
      entityId: email ? hashEmailSha256(email) : 'filtered',
      message: 'Exported GDPR consent proof events (CSV)',
      meta: {
        filters: { email: email ? '[provided]' : undefined, q: q || undefined, from: from || undefined, to: to || undefined },
        rowCount: rows.length,
      },
    });

    const header = [
      'createdAt',
      'emailHash',
      'emailDomain',
      'emailMasked',
      'consentType',
      'legalBasis',
      'source',
      'policyVersion',
      'actorId',
      'actorEmail',
      'ip',
      'userAgent',
    ];

    const lines = [header.join(',')].concat(
      rows.map((r) =>
        [
          r.createdAt?.toISOString?.() ?? '',
          r.emailHash ?? '',
          r.emailDomain ?? '',
          r.emailMasked ?? '',
          r.consentType ?? '',
          r.legalBasis ?? '',
          r.source ?? '',
          r.policyVersion ?? '',
          r.actorId ?? '',
          r.actorEmail ?? '',
          r.ip ?? '',
          r.userAgent ?? '',
        ]
          .map(csvEscape)
          .join(',')
      )
    );

    const csv = lines.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="gdpr_consent_proof_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
