import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerWebhookDeliveries, developerWebhookEndpoints } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';

// POST: Retry a failed delivery
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; deliveryId: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const delivery = await db.query.developerWebhookDeliveries.findFirst({
      where: eq(developerWebhookDeliveries.id, params.deliveryId),
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.endpointId !== params.id) {
      return NextResponse.json({ error: 'Delivery does not belong to this endpoint' }, { status: 400 });
    }

    if (delivery.status !== 'failed') {
      return NextResponse.json({ error: 'Can only retry failed deliveries' }, { status: 400 });
    }

    // Check endpoint is active
    const endpoint = await db.query.developerWebhookEndpoints.findFirst({
      where: eq(developerWebhookEndpoints.id, params.id),
    });

    if (!endpoint || endpoint.status !== 'active') {
      return NextResponse.json({ error: 'Endpoint is not active' }, { status: 400 });
    }

    // Reset delivery for retry
    const [updated] = await db
      .update(developerWebhookDeliveries)
      .set({
        status: 'pending',
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lastError: null,
        lastStatusCode: null,
        completedAt: null,
      })
      .where(eq(developerWebhookDeliveries.id, params.deliveryId))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_delivery.retry',
      entityType: 'developer_webhook_delivery',
      entityId: params.deliveryId,
      message: `Retried webhook delivery for event ${delivery.eventType} (${delivery.eventId})`,
      meta: { endpointId: params.id, eventType: delivery.eventType },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery queued for retry',
      delivery: {
        id: updated.id,
        status: updated.status,
        nextAttemptAt: updated.nextAttemptAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook delivery retry error:', err);
    return NextResponse.json({ error: 'Failed to retry delivery' }, { status: 500 });
  }
}
