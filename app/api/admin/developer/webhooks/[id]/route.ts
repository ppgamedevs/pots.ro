import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerWebhookEndpoints, developerWebhookDeliveries } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq, desc, sql } from 'drizzle-orm';

// GET: Get single webhook endpoint details + recent deliveries
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const endpoint = await db.query.developerWebhookEndpoints.findFirst({
      where: eq(developerWebhookEndpoints.id, params.id),
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    // Get recent deliveries
    type DeliveryRow = {
      id: string;
      eventType: string;
      eventId: string;
      status: string;
      attemptCount: number;
      maxAttempts: number;
      lastStatusCode: number | null;
      lastError: string | null;
      durationMs: number | null;
      createdAt: Date;
      completedAt: Date | null;
    };

    const deliveries: DeliveryRow[] = await db
      .select({
        id: developerWebhookDeliveries.id,
        eventType: developerWebhookDeliveries.eventType,
        eventId: developerWebhookDeliveries.eventId,
        status: developerWebhookDeliveries.status,
        attemptCount: developerWebhookDeliveries.attemptCount,
        maxAttempts: developerWebhookDeliveries.maxAttempts,
        lastStatusCode: developerWebhookDeliveries.lastStatusCode,
        lastError: developerWebhookDeliveries.lastError,
        durationMs: developerWebhookDeliveries.durationMs,
        createdAt: developerWebhookDeliveries.createdAt,
        completedAt: developerWebhookDeliveries.completedAt,
      })
      .from(developerWebhookDeliveries)
      .where(eq(developerWebhookDeliveries.endpointId, params.id))
      .orderBy(desc(developerWebhookDeliveries.createdAt))
      .limit(50);

    // Get delivery stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        successful: sql<number>`count(*) FILTER (WHERE status = 'success')`,
        failed: sql<number>`count(*) FILTER (WHERE status = 'failed')`,
        pending: sql<number>`count(*) FILTER (WHERE status = 'pending')`,
      })
      .from(developerWebhookDeliveries)
      .where(eq(developerWebhookDeliveries.endpointId, params.id));

    return NextResponse.json({
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        description: endpoint.description,
        status: endpoint.status,
        secretPrefix: endpoint.secretPrefix,
        secretCreatedAt: endpoint.secretCreatedAt,
        events: endpoint.events,
        headers: endpoint.headers,
        retryPolicy: endpoint.retryPolicy,
        lastDeliveryAt: endpoint.lastDeliveryAt,
        lastDeliveryStatus: endpoint.lastDeliveryStatus,
        consecutiveFailures: endpoint.consecutiveFailures,
        disabledReason: endpoint.disabledReason,
        createdBy: endpoint.createdBy,
        createdAt: endpoint.createdAt,
      },
      deliveries,
      stats: {
        total: Number(stats?.total ?? 0),
        successful: Number(stats?.successful ?? 0),
        failed: Number(stats?.failed ?? 0),
        pending: Number(stats?.pending ?? 0),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook endpoint get error:', err);
    return NextResponse.json({ error: 'Failed to get webhook endpoint' }, { status: 500 });
  }
}

// PATCH: Update webhook endpoint
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const body = await req.json();
    const { action, name, url, description, events, headers, retryPolicy, status } = body as {
      action?: 'pause' | 'resume' | 'disable';
      name?: string;
      url?: string;
      description?: string;
      events?: string[];
      headers?: Record<string, string>;
      retryPolicy?: { maxAttempts: number; backoffMs: number };
      status?: 'active' | 'paused' | 'disabled';
    };

    const endpoint = await db.query.developerWebhookEndpoints.findFirst({
      where: eq(developerWebhookEndpoints.id, params.id),
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    // Handle status actions
    if (action === 'pause') {
      await db
        .update(developerWebhookEndpoints)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(eq(developerWebhookEndpoints.id, params.id));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'webhook_endpoint.pause',
        entityType: 'developer_webhook_endpoint',
        entityId: params.id,
        message: `Paused webhook endpoint "${endpoint.name}"`,
      });

      return NextResponse.json({ success: true, message: 'Endpoint paused' });
    }

    if (action === 'resume') {
      await db
        .update(developerWebhookEndpoints)
        .set({ status: 'active', consecutiveFailures: 0, disabledReason: null, updatedAt: new Date() })
        .where(eq(developerWebhookEndpoints.id, params.id));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'webhook_endpoint.resume',
        entityType: 'developer_webhook_endpoint',
        entityId: params.id,
        message: `Resumed webhook endpoint "${endpoint.name}"`,
      });

      return NextResponse.json({ success: true, message: 'Endpoint resumed' });
    }

    if (action === 'disable') {
      await db
        .update(developerWebhookEndpoints)
        .set({ status: 'disabled', disabledReason: 'Manually disabled', updatedAt: new Date() })
        .where(eq(developerWebhookEndpoints.id, params.id));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'webhook_endpoint.disable',
        entityType: 'developer_webhook_endpoint',
        entityId: params.id,
        message: `Disabled webhook endpoint "${endpoint.name}"`,
      });

      return NextResponse.json({ success: true, message: 'Endpoint disabled' });
    }

    // Update fields
    const updates: Partial<typeof developerWebhookEndpoints.$inferInsert> = { updatedAt: new Date() };
    if (name && typeof name === 'string' && name.trim().length >= 3) {
      updates.name = name.trim();
    }
    if (url && typeof url === 'string') {
      try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
          updates.url = url;
        }
      } catch {
        // Invalid URL, ignore
      }
    }
    if (description !== undefined) {
      updates.description = description || null;
    }
    if (Array.isArray(events)) {
      updates.events = events;
    }
    if (headers !== undefined) {
      updates.headers = headers;
    }
    if (retryPolicy) {
      updates.retryPolicy = retryPolicy;
    }
    if (status) {
      updates.status = status;
    }

    const [updated] = await db
      .update(developerWebhookEndpoints)
      .set(updates)
      .where(eq(developerWebhookEndpoints.id, params.id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_endpoint.update',
      entityType: 'developer_webhook_endpoint',
      entityId: params.id,
      message: `Updated webhook endpoint "${updated.name}"`,
      meta: { updates },
    });

    return NextResponse.json({ success: true, endpoint: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook endpoint update error:', err);
    return NextResponse.json({ error: 'Failed to update webhook endpoint' }, { status: 500 });
  }
}

// DELETE: Delete webhook endpoint
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const endpoint = await db.query.developerWebhookEndpoints.findFirst({
      where: eq(developerWebhookEndpoints.id, params.id),
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    await db.delete(developerWebhookEndpoints).where(eq(developerWebhookEndpoints.id, params.id));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_endpoint.delete',
      entityType: 'developer_webhook_endpoint',
      entityId: params.id,
      message: `Deleted webhook endpoint "${endpoint.name}" (${endpoint.url})`,
    });

    return NextResponse.json({ success: true, message: 'Endpoint deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook endpoint delete error:', err);
    return NextResponse.json({ error: 'Failed to delete webhook endpoint' }, { status: 500 });
  }
}
