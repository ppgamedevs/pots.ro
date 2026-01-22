import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, auditLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { validateReturnRequest, RETURN_POLICY } from '@/lib/returns/policy';
import { logWebhook } from '@/lib/webhook-logging';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/orders/[id]/request-return
 * Cerere de retur de la buyer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    
    const { reason, items } = body;

    if (!reason || !items || !Array.isArray(items)) {
      return NextResponse.json({
        success: false,
        error: 'Motivul și item-urile sunt obligatorii'
      }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    console.log(`🔄 Procesez cererea de retur pentru comanda ${orderId}`);

    // Găsește comanda
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Comanda nu a fost găsită'
      }, { status: 404 });
    }

    if (order.buyerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    // Validează cererea de retur
    const returnRequest = {
      orderId,
      reason,
      items,
      requestedAt: new Date()
    };

    const validation = validateReturnRequest(order, returnRequest);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.reason,
        policyViolations: validation.policyViolations
      }, { status: 400 });
    }

    // Actualizează status-ul comenzii
    await db.update(orders)
      .set({ 
        status: 'return_requested',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    // Înregistrează în audit log
    await db.insert(auditLogs).values({
      orderId: orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'request_return',
      meta: {
        reason,
        items,
        policy: RETURN_POLICY
      }
    });

    // Log webhook
    await logWebhook({
      source: 'orders',
      ref: orderId,
      payload: { action: 'request_return', reason, items },
      result: 'ok'
    });

    console.log(`✅ Cererea de retur pentru comanda ${orderId} a fost procesată`);

    return NextResponse.json({
      success: true,
      orderId,
      status: 'return_requested',
      message: 'Cererea de retur a fost trimisă către vânzător'
    });
  } catch (error) {
    console.error('Eroare la procesarea cererii de retur:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
