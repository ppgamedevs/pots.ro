import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprDsrRequests, gdprPreferences, orders, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const actor = await requireRole(req, ['admin']);
    const requestId = ctx.params.id;

    const [dsar] = await db
      .select({
        id: gdprDsrRequests.id,
        type: gdprDsrRequests.type,
        status: gdprDsrRequests.status,
        email: gdprDsrRequests.email,
        emailMasked: gdprDsrRequests.emailMasked,
        emailHash: gdprDsrRequests.emailHash,
        requestedAt: gdprDsrRequests.requestedAt,
        verifiedAt: gdprDsrRequests.verifiedAt,
        dueAt: gdprDsrRequests.dueAt,
      })
      .from(gdprDsrRequests)
      .where(eq(gdprDsrRequests.id, requestId))
      .limit(1);

    if (!dsar) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dsar.type !== 'export') return NextResponse.json({ error: 'Not an export request' }, { status: 400 });
    if (!dsar.verifiedAt) return NextResponse.json({ error: 'Request not verified yet' }, { status: 409 });

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        displayId: users.displayId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, dsar.email))
      .limit(1);

    const preference = await db
      .select({
        consentType: gdprPreferences.consentType,
        createdAt: gdprPreferences.createdAt,
        updatedAt: gdprPreferences.updatedAt,
      })
      .from(gdprPreferences)
      .where(eq(gdprPreferences.email, dsar.email))
      .limit(1);

    const ordersRows = user
      ? await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            currency: orders.currency,
            subtotalCents: orders.subtotalCents,
            shippingFeeCents: orders.shippingFeeCents,
            totalDiscountCents: orders.totalDiscountCents,
            totalCents: orders.totalCents,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(eq(orders.buyerId, user.id))
          .orderBy(desc(orders.createdAt))
          .limit(500)
      : [];

    const exportPayload = {
      generatedAt: new Date().toISOString(),
      request: {
        id: dsar.id,
        type: dsar.type,
        status: dsar.status,
        emailMasked: dsar.emailMasked,
        emailHash: dsar.emailHash,
        requestedAt: dsar.requestedAt?.toISOString?.(),
        verifiedAt: dsar.verifiedAt?.toISOString?.(),
        dueAt: dsar.dueAt?.toISOString?.(),
      },
      user: user || null,
      gdprPreference: preference?.[0] || null,
      orders: ordersRows,
    };

    await db
      .update(gdprDsrRequests)
      .set({
        status: 'fulfilled',
        handledBy: actor.id,
        completedAt: new Date(),
        meta: {
          export: {
            userFound: !!user,
            ordersCount: ordersRows.length,
          },
        },
      })
      .where(eq(gdprDsrRequests.id, requestId));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'gdpr.dsar.export_generated',
      entityType: 'gdpr_dsr_request',
      entityId: requestId,
      message: `Generated DSAR export for ${dsar.emailMasked || dsar.emailHash}`,
      meta: {
        type: dsar.type,
        emailHash: dsar.emailHash,
        userFound: !!user,
        ordersCount: ordersRows.length,
      },
    });

    const json = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="gdpr_export_${requestId}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
