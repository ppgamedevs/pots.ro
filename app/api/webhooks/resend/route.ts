import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { db } from '@/db';
import {
  communicationBroadcastRecipients,
  emailDeliverabilityEvents,
  emailSuppressions,
} from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResendWebhookEvent = {
  type?: string;
  data?: Record<string, any>;
};

function mapResendType(type: string | undefined):
  | 'delivered'
  | 'bounced'
  | 'complained'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'unknown' {
  const t = String(type || '').toLowerCase();
  if (t.includes('delivered')) return 'delivered';
  if (t.includes('bounced')) return 'bounced';
  if (t.includes('complaint') || t.includes('complained')) return 'complained';
  if (t.includes('opened') || t.includes('open')) return 'opened';
  if (t.includes('clicked') || t.includes('click')) return 'clicked';
  if (t.includes('failed')) return 'failed';
  return 'unknown';
}

function extractMessageId(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  return (
    data.email_id ||
    data.emailId ||
    data.id ||
    data.message_id ||
    data.messageId ||
    null
  );
}

function extractEmail(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const to = data.to || data.recipient || data.email;
  if (Array.isArray(to)) return to[0] ? String(to[0]) : null;
  return to ? String(to) : null;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    const payload = await req.text();

    let event: ResendWebhookEvent;

    if (secret) {
      const headers = {
        'svix-id': req.headers.get('svix-id') || '',
        'svix-timestamp': req.headers.get('svix-timestamp') || '',
        'svix-signature': req.headers.get('svix-signature') || '',
      };

      const wh = new Webhook(secret);
      event = wh.verify(payload, headers) as any;
    } else {
      // Dev fallback; strongly recommend setting RESEND_WEBHOOK_SECRET.
      event = JSON.parse(payload) as any;
    }

    const eventType = mapResendType(event.type);
    const providerMessageId = extractMessageId(event.data);
    const email = extractEmail(event.data);

    const occurredAtRaw = event?.data?.created_at || event?.data?.createdAt || event?.data?.timestamp;
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();

    // Best-effort linking to broadcast/user based on provider message id.
    const linked = providerMessageId
      ? await db
          .select({
            broadcastId: communicationBroadcastRecipients.broadcastId,
            userId: communicationBroadcastRecipients.userId,
            email: communicationBroadcastRecipients.email,
          })
          .from(communicationBroadcastRecipients)
          .where(eq(communicationBroadcastRecipients.providerMessageId, providerMessageId))
          .limit(1)
      : [];

    const linkedRow = linked?.[0];

    const insertBase = {
      provider: 'resend',
      eventType,
      providerMessageId: providerMessageId || null,
      email: (email || linkedRow?.email || null) as any,
      occurredAt: Number.isFinite(occurredAt.getTime()) ? occurredAt : new Date(),
      broadcastId: linkedRow?.broadcastId ?? null,
      userId: linkedRow?.userId ?? null,
      meta: event as any,
    };

    const insertQuery = providerMessageId
      ? db
          .insert(emailDeliverabilityEvents)
          .values(insertBase as any)
          .onConflictDoNothing({
            target: [
              emailDeliverabilityEvents.provider,
              emailDeliverabilityEvents.providerMessageId,
              emailDeliverabilityEvents.eventType,
            ],
          })
      : db.insert(emailDeliverabilityEvents).values(insertBase as any);

    const inserted = await insertQuery.returning({ id: emailDeliverabilityEvents.id });
    const insertedId = inserted?.[0]?.id ?? null;

    if (providerMessageId) {
      if (eventType === 'delivered') {
        await db
          .update(communicationBroadcastRecipients)
          .set({ status: 'delivered', updatedAt: new Date() })
          .where(eq(communicationBroadcastRecipients.providerMessageId, providerMessageId));
      }

      if (eventType === 'bounced' || eventType === 'complained') {
        await db
          .update(communicationBroadcastRecipients)
          .set({ status: eventType === 'bounced' ? 'bounced' : 'complained', updatedAt: new Date() })
          .where(eq(communicationBroadcastRecipients.providerMessageId, providerMessageId));
      }
    }

    if (email && (eventType === 'bounced' || eventType === 'complained')) {
      const now = new Date();
      await db
        .insert(emailSuppressions)
        .values({
          email: email.toLowerCase(),
          reason: eventType === 'bounced' ? 'bounce' : 'complaint',
          source: 'resend',
          note: providerMessageId ? `resend:${providerMessageId}` : 'resend:webhook',
          createdAt: now,
          updatedAt: now,
        } as any)
        .onConflictDoUpdate({
          target: emailSuppressions.email,
          set: {
            reason: eventType === 'bounced' ? 'bounce' : 'complaint',
            source: 'resend',
            note: providerMessageId ? `resend:${providerMessageId}` : 'resend:webhook',
            revokedAt: null,
            revokedBy: null,
            updatedAt: now,
          } as any,
        });
    }

    // Lightweight idempotency: if Resend retries, we still return ok.
    return NextResponse.json({ ok: true, id: insertedId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'resend-webhook' });
}
