import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprConsentEvents, gdprPreferences } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { getClientIP, getUserAgent, normalizeEmail } from '@/lib/auth/crypto';
import { getEmailDomain, hashEmailSha256 } from '@/lib/compliance/gdpr';
import { maskEmail } from '@/lib/security/pii';
import { writeAdminAudit } from '@/lib/admin/audit';
import { getSettingTyped } from '@/lib/settings/store';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
  consentType: z.enum(['necessary', 'all']),
  legalBasis: z.enum(['consent', 'legitimate_interest', 'contract', 'legal_obligation', 'other']),
  reason: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin']);

    const body = bodySchema.parse(await req.json());
    const email = normalizeEmail(body.email);
    const emailHash = hashEmailSha256(email);

    const existing = await db
      .select({ id: gdprPreferences.id })
      .from(gdprPreferences)
      .where(eq(gdprPreferences.email, email))
      .limit(1);

    if (existing.length) {
      await db
        .update(gdprPreferences)
        .set({ consentType: body.consentType, updatedAt: new Date() })
        .where(eq(gdprPreferences.email, email));
    } else {
      await db.insert(gdprPreferences).values({ email, consentType: body.consentType });
    }

    const policyVersion = await getSettingTyped<string>('gdpr.consent_policy_version', '');

    await db.insert(gdprConsentEvents).values({
      emailHash,
      emailDomain: getEmailDomain(email) || null,
      emailMasked: maskEmail(email),
      consentType: body.consentType,
      legalBasis: body.legalBasis,
      source: 'admin',
      actorId: actor.id,
      ip: getClientIP(req.headers),
      userAgent: getUserAgent(req.headers),
      policyVersion: policyVersion || null,
    });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'gdpr.consent.update',
      entityType: 'gdpr_consent',
      entityId: emailHash,
      message: `Admin updated consent preference for ${maskEmail(email)}`,
      meta: {
        consentType: body.consentType,
        legalBasis: body.legalBasis,
        reason: body.reason,
        emailDomain: getEmailDomain(email),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
