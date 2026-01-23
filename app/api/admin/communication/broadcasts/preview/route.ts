import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { emailSuppressions, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { and, inArray, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const schema = z
  .object({
    roles: z.array(z.enum(['buyer', 'seller'])).min(1),
    requireEmailNotifications: z.boolean().default(true),
    requirePromotionsOptIn: z.boolean().default(false),
    requireNewsletterOptIn: z.boolean().default(false),
  })
  .strict();

type Prefs = {
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
};

type CandidateUser = {
  id: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin' | 'support';
  prefs: unknown;
};

type SuppressedRow = {
  email: string;
};

function parsePrefs(value: unknown): Prefs {
  const defaults: Prefs = {
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  };

  if (!value) return defaults;
  if (typeof value === 'object') return { ...defaults, ...(value as any) };
  if (typeof value === 'string') {
    try {
      return { ...defaults, ...(JSON.parse(value) as any) };
    } catch {
      return defaults;
    }
  }
  return defaults;
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const candidates: CandidateUser[] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        prefs: users.notificationPreferences,
      })
      .from(users)
      .where(inArray(users.role, parsed.data.roles as any))
      .limit(20000);

    const eligible = candidates.filter((u: CandidateUser) => {
      const prefs = parsePrefs(u.prefs);
      if (parsed.data.requireEmailNotifications && !prefs.emailNotifications) return false;
      if (parsed.data.requirePromotionsOptIn && !prefs.promotions) return false;
      if (parsed.data.requireNewsletterOptIn && !prefs.newsletter) return false;
      return true;
    });

    const emails = eligible.map((u) => String(u.email).toLowerCase());

    // Remove suppressed
    const suppressedRows: SuppressedRow[] = emails.length
      ? await db
          .select({ email: emailSuppressions.email })
          .from(emailSuppressions)
          .where(and(inArray(emailSuppressions.email, emails as any), isNull(emailSuppressions.revokedAt)))
      : [];

    const suppressedSet = new Set(suppressedRows.map((r) => String(r.email).toLowerCase()));
    const finalEmails = emails.filter((e) => !suppressedSet.has(e));

    const byRole: Record<string, number> = {};
    for (const u of eligible) byRole[String(u.role)] = (byRole[String(u.role)] || 0) + 1;

    return NextResponse.json({
      roles: parsed.data.roles,
      counts: {
        candidates: candidates.length,
        eligibleByPrefs: eligible.length,
        suppressed: suppressedSet.size,
        estimatedRecipients: finalEmails.length,
      },
      byRole,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
