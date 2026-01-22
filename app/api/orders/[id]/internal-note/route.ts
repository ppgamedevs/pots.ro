import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, orders } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  note: z.string().trim().min(1).max(2000),
});

/**
 * POST /api/orders/[id]/internal-note
 * Stores an internal note as an audit log entry (no extra schema).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'support')) {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { note } = schema.parse(await request.json());

    const exists = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Comanda nu a fost găsită' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'internal_note',
      meta: { note },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Eroare necunoscută';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
