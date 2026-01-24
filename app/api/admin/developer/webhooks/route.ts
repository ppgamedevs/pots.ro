import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerWebhookEndpoints, developerWebhookDeliveries, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { desc, eq, and, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { hash } from '@/lib/auth/crypto';

// Available event types for outbound webhooks
const AVAILABLE_EVENTS = [
  'order.created',
  'order.paid',
  'order.shipped',
  'order.delivered',
  'order.canceled',
  'order.refunded',
  'product.created',
  'product.updated',
  'product.deleted',
  'seller.approved',
  'seller.suspended',
  'payout.created',
  'payout.completed',
  'payout.failed',
];

// Generate a webhook signing secret
function generateWebhookSecret(): { secret: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  const prefix = `whsec_${randomBytes.slice(0, 8)}`;
  const secret = `${prefix}_${randomBytes}`;
  return { secret, prefix };
}

// GET: List webhook endpoints
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(developerWebhookEndpoints.status, status as 'active' | 'paused' | 'disabled'));
    }

    type EndpointRow = {
      id: string;
      name: string;
      url: string;
      description: string | null;
      status: string;
      secretPrefix: string;
      secretCreatedAt: Date;
      events: string[];
      headers: Record<string, string> | null;
      retryPolicy: { maxAttempts: number; backoffMs: number } | null;
      lastDeliveryAt: Date | null;
      lastDeliveryStatus: string | null;
      consecutiveFailures: number;
      disabledReason: string | null;
      createdBy: string;
      createdAt: Date;
      creatorEmail: string | null;
    };

    const endpoints: EndpointRow[] = await db
      .select({
        id: developerWebhookEndpoints.id,
        name: developerWebhookEndpoints.name,
        url: developerWebhookEndpoints.url,
        description: developerWebhookEndpoints.description,
        status: developerWebhookEndpoints.status,
        secretPrefix: developerWebhookEndpoints.secretPrefix,
        secretCreatedAt: developerWebhookEndpoints.secretCreatedAt,
        events: developerWebhookEndpoints.events,
        headers: developerWebhookEndpoints.headers,
        retryPolicy: developerWebhookEndpoints.retryPolicy,
        lastDeliveryAt: developerWebhookEndpoints.lastDeliveryAt,
        lastDeliveryStatus: developerWebhookEndpoints.lastDeliveryStatus,
        consecutiveFailures: developerWebhookEndpoints.consecutiveFailures,
        disabledReason: developerWebhookEndpoints.disabledReason,
        createdBy: developerWebhookEndpoints.createdBy,
        createdAt: developerWebhookEndpoints.createdAt,
        creatorEmail: users.email,
      })
      .from(developerWebhookEndpoints)
      .leftJoin(users, eq(developerWebhookEndpoints.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(developerWebhookEndpoints.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(developerWebhookEndpoints)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      endpoints: endpoints.map((e) => ({
        id: e.id,
        name: e.name,
        url: e.url,
        description: e.description,
        status: e.status,
        secretPrefix: e.secretPrefix,
        secretCreatedAt: e.secretCreatedAt,
        events: e.events,
        headers: e.headers,
        retryPolicy: e.retryPolicy,
        lastDeliveryAt: e.lastDeliveryAt,
        lastDeliveryStatus: e.lastDeliveryStatus,
        consecutiveFailures: e.consecutiveFailures,
        disabledReason: e.disabledReason,
        createdBy: e.createdBy,
        creatorEmail: e.creatorEmail,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
      availableEvents: AVAILABLE_EVENTS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook endpoints list error:', err);
    return NextResponse.json({ error: 'Failed to list webhook endpoints' }, { status: 500 });
  }
}

// POST: Create a new webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const body = await req.json();
    const { name, url, description, events, headers, retryPolicy } = body as {
      name?: string;
      url?: string;
      description?: string;
      events?: string[];
      headers?: Record<string, string>;
      retryPolicy?: { maxAttempts: number; backoffMs: number };
    };

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Name must be at least 3 characters' }, { status: 400 });
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Validate events
    const validEvents = (events || []).filter((e: string) => AVAILABLE_EVENTS.includes(e));
    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'At least one valid event type is required' }, { status: 400 });
    }

    // Generate the signing secret
    const { secret, prefix } = generateWebhookSecret();
    const secretHash = await hash(secret);

    // Insert the endpoint
    const [inserted] = await db
      .insert(developerWebhookEndpoints)
      .values({
        name: name.trim(),
        url,
        description: description || null,
        events: validEvents,
        headers: headers || null,
        retryPolicy: retryPolicy || { maxAttempts: 3, backoffMs: 1000 },
        secretHash,
        secretPrefix: prefix,
        createdBy: user.id,
      })
      .returning();

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_endpoint.create',
      entityType: 'developer_webhook_endpoint',
      entityId: inserted.id,
      message: `Created webhook endpoint "${name.trim()}" for ${url}`,
      meta: { events: validEvents },
    });

    // Return the secret ONCE - it won't be shown again
    return NextResponse.json({
      endpoint: {
        id: inserted.id,
        name: inserted.name,
        url: inserted.url,
        description: inserted.description,
        status: inserted.status,
        events: inserted.events,
        secretPrefix: inserted.secretPrefix,
        createdAt: inserted.createdAt,
      },
      // This is the ONLY time the signing secret is returned
      signingSecret: secret,
      warning: 'Save this signing secret now. It will not be shown again.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook endpoint create error:', err);
    return NextResponse.json({ error: 'Failed to create webhook endpoint' }, { status: 500 });
  }
}
