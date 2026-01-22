import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, auditLogs } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { logWebhook } from '@/lib/webhook-logging';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sellerIdsForUser } from '@/lib/ownership';

/**
 * POST /api/orders/[id]/approve-return
 * Aprobare cerere de retur de la admin/seller
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    
    const { method, notes } = body; // method: 'exchange' | 'refund'

    if (!method || !['exchange', 'refund'].includes(method)) {
      return NextResponse.json({
        success: false,
        error: 'Metoda trebuie să fie "exchange" sau "refund"'
      }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'support' && user.role !== 'seller')) {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    console.log(`✅ Aprob cererea de retur pentru comanda ${orderId} (metoda: ${method})`);

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

    if (user.role === 'seller') {
      const ids = await sellerIdsForUser(user.id);
      if (!ids.includes(order.sellerId)) {
        return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
      }
    }

    if (order.status !== 'return_requested') {
      return NextResponse.json({
        success: false,
        error: 'Comanda nu are cerere de retur în așteptare'
      }, { status: 400 });
    }

    // Actualizează status-ul comenzii
    await db.update(orders)
      .set({ 
        status: 'return_approved',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    // Înregistrează în audit log
    await db.insert(auditLogs).values({
      orderId: orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'approve_return',
      meta: {
        method,
        notes,
        approvedAt: new Date().toISOString()
      }
    });

    // Log webhook
    await logWebhook({
      source: 'orders',
      ref: orderId,
      payload: { action: 'approve_return', method, notes },
      result: 'ok'
    });

    console.log(`✅ Cererea de retur pentru comanda ${orderId} a fost aprobată`);

    return NextResponse.json({
      success: true,
      orderId,
      status: 'return_approved',
      method,
      message: `Cererea de retur a fost aprobată (${method === 'exchange' ? 'schimb' : 'rambursare'})`
    });
  } catch (error) {
    console.error('Eroare la aprobarea cererii de retur:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
