import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import {
  communicationBroadcastRecipients,
  communicationBroadcasts,
  emailSuppressions,
  users,
} from '@/db/schema/core';
import { emailService } from '@/lib/email';
import { and, asc, eq, inArray, isNull, lte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function segmentPredicate(kind: 'system' | 'announcement' | 'marketing', segment: any, prefs: Prefs) {
  // System/announcements: only requires emailNotifications by default.
  // Marketing: must have promotions OR newsletter opt-in.
  if (segment?.requireEmailNotifications !== false && !prefs.emailNotifications) return false;

  if (kind === 'marketing') {
    const requirePromotions = segment?.requirePromotionsOptIn ?? true;
    const requireNewsletter = segment?.requireNewsletterOptIn ?? false;

    const okPromotions = requirePromotions ? prefs.promotions : true;
    const okNewsletter = requireNewsletter ? prefs.newsletter : true;

    return okPromotions && okNewsletter;
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Pick one scheduled broadcast due now
    const [broadcast] = await db
      .select({
        id: communicationBroadcasts.id,
        kind: communicationBroadcasts.kind,
        status: communicationBroadcasts.status,
        subject: communicationBroadcasts.subject,
        html: communicationBroadcasts.html,
        text: communicationBroadcasts.text,
        fromEmail: communicationBroadcasts.fromEmail,
        segment: communicationBroadcasts.segment,
        scheduledAt: communicationBroadcasts.scheduledAt,
      })
      .from(communicationBroadcasts)
      .where(and(eq(communicationBroadcasts.status, 'scheduled'), lte(communicationBroadcasts.scheduledAt, now)))
      .orderBy(asc(communicationBroadcasts.scheduledAt))
      .limit(1);

    if (!broadcast) {
      return NextResponse.json({ ok: true, message: 'No broadcasts due' });
    }

    // Transition to sending (best-effort; avoids double runners)
    await db
      .update(communicationBroadcasts)
      .set({ status: 'sending', sendStartedAt: now, updatedAt: now } as any)
      .where(and(eq(communicationBroadcasts.id, broadcast.id), eq(communicationBroadcasts.status, 'scheduled')));

    // Load candidate users (limit to avoid runaway)
    const roles: Array<'buyer' | 'seller'> = Array.isArray((broadcast.segment as any)?.roles)
      ? (broadcast.segment as any).roles
      : broadcast.kind === 'marketing'
        ? ['buyer', 'seller']
        : ['buyer', 'seller'];

    const candidateUsers: CandidateUser[] = await db
      .select({ id: users.id, email: users.email, role: users.role, prefs: users.notificationPreferences })
      .from(users)
      .where(inArray(users.role, roles as any))
      .limit(20000);

    const eligibleUsers = candidateUsers
      .filter((u: CandidateUser) => segmentPredicate(broadcast.kind as any, broadcast.segment, parsePrefs(u.prefs)))
      .slice(0, 5000);

    const emails = eligibleUsers.map((u: CandidateUser) => String(u.email).toLowerCase());

    // Suppression filter
    const suppressed = new Set<string>();
    for (const c of chunk(emails, 500)) {
      const rows: SuppressedRow[] = await db
        .select({ email: emailSuppressions.email })
        .from(emailSuppressions)
        .where(and(inArray(emailSuppressions.email, c as any), isNull(emailSuppressions.revokedAt)));
      for (const r of rows) suppressed.add(String(r.email).toLowerCase());
    }

    const recipients = eligibleUsers
      .filter((u: CandidateUser) => !suppressed.has(String(u.email).toLowerCase()))
      .map((u: CandidateUser) => ({ userId: u.id, email: String(u.email).toLowerCase() }));

    // Insert recipients idempotently
    if (recipients.length) {
      await db
        .insert(communicationBroadcastRecipients)
        .values(
          recipients.map((r) => ({
            broadcastId: broadcast.id,
            userId: r.userId,
            email: r.email,
            status: 'pending',
            provider: 'resend',
            createdAt: now,
            updatedAt: now,
          })) as any
        )
        .onConflictDoNothing();
    }

    // Send a small batch
    const pending = await db
      .select({
        id: communicationBroadcastRecipients.id,
        email: communicationBroadcastRecipients.email,
      })
      .from(communicationBroadcastRecipients)
      .where(and(eq(communicationBroadcastRecipients.broadcastId, broadcast.id), eq(communicationBroadcastRecipients.status, 'pending')))
      .limit(200);

    let sent = 0;
    let failed = 0;

    for (const r of pending as any[]) {
      const to = String(r.email);

      // Check suppression again (race-safe)
      const [s] = await db
        .select({ email: emailSuppressions.email })
        .from(emailSuppressions)
        .where(and(eq(emailSuppressions.email, to), isNull(emailSuppressions.revokedAt)))
        .limit(1);

      if (s) {
        await db
          .update(communicationBroadcastRecipients)
          .set({ status: 'suppressed', updatedAt: new Date() } as any)
          .where(eq(communicationBroadcastRecipients.id, r.id));
        continue;
      }

      const result = await emailService.sendHtmlEmail({
        to,
        subject: String(broadcast.subject),
        html: String(broadcast.html),
        text: broadcast.text ? String(broadcast.text) : undefined,
        from: broadcast.fromEmail ? String(broadcast.fromEmail) : undefined,
      });

      if (result.success) {
        sent += 1;
        await db
          .update(communicationBroadcastRecipients)
          .set({
            status: 'sent',
            providerMessageId: result.messageId || null,
            sentAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .where(eq(communicationBroadcastRecipients.id, r.id));
      } else {
        failed += 1;
        await db
          .update(communicationBroadcastRecipients)
          .set({ status: 'failed', error: result.error || 'send_failed', updatedAt: new Date() } as any)
          .where(eq(communicationBroadcastRecipients.id, r.id));
      }
    }

    // If no pending left, finalize
    const [remaining] = await db
      .select({ c: sql<number>`count(*)` })
      .from(communicationBroadcastRecipients)
      .where(and(eq(communicationBroadcastRecipients.broadcastId, broadcast.id), eq(communicationBroadcastRecipients.status, 'pending')));

    if (Number(remaining?.c ?? 0) === 0) {
      await db
        .update(communicationBroadcasts)
        .set({ status: 'sent', sendCompletedAt: new Date(), updatedAt: new Date() } as any)
        .where(eq(communicationBroadcasts.id, broadcast.id));
    }

    return NextResponse.json({
      ok: true,
      broadcastId: broadcast.id,
      sent,
      failed,
      remainingPending: Number(remaining?.c ?? 0),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'communication-broadcasts-cron' });
}
