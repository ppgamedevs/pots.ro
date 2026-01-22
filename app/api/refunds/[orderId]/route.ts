import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds, orders, orderItems, payouts, ledger } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';
import { retryWithLogging, isRefundRetryableError } from '@/lib/util/retry';
import { recordRefund } from '@/lib/ledger/post';
import { logWebhook } from '@/lib/webhook-logging';
import { emailService } from '@/lib/email';
import React from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { writeAdminAudit } from '@/lib/admin/audit';
import { logOrderAction } from '@/lib/audit';
import { processRefund as processRefundShared } from '@/lib/refunds/process';

/**
 * POST /api/refunds/[orderId]
 * Creează un refund pentru o comandă (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    
    const { amount, reason, items } = body;

    if (!amount || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Suma și motivul sunt obligatorii'
      }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acces interzis' }, { status: 403 });
    }

    console.log(`🔄 Procesez refund pentru comanda ${orderId}: ${amount} RON`);

    // Găsește comanda și item-urile sale
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Comanda nu a fost găsită'
      }, { status: 404 });
    }

    // Verifică dacă comanda poate fi refundată
    if (order.status !== 'paid' && order.status !== 'delivered' && order.status !== 'return_approved') {
      return NextResponse.json({
        success: false,
        error: 'Comanda nu poate fi refundată în status-ul curent'
      }, { status: 400 });
    }

    // Verifică dacă suma de refund nu depășește totalul comenzii
    const maxRefundAmount = order.totalCents / 100;
    if (amount > maxRefundAmount) {
      return NextResponse.json({
        success: false,
        error: `Suma de refund (${amount}) nu poate depăși totalul comenzii (${maxRefundAmount})`
      }, { status: 400 });
    }

    // Verifică dacă există deja un refund pentru această comandă
    const existingRefund = await db.query.refunds.findFirst({
      where: eq(refunds.orderId, orderId)
    });

    if (existingRefund) {
      return NextResponse.json({
        success: false,
        error: 'Există deja un refund pentru această comandă'
      }, { status: 400 });
    }

    const LARGE_REFUND_RON = Number.parseFloat(process.env.LARGE_REFUND_RON || '500');
    const requiresApproval = Number.isFinite(LARGE_REFUND_RON) && amount >= LARGE_REFUND_RON;

    // Creează refund-ul
    const refund = await db.insert(refunds).values({
      orderId: orderId,
      amount: amount.toString(),
      reason: reason,
      status: 'pending',
      failureReason: requiresApproval ? 'approval_required' : null,
    }).returning();

    const refundId = refund[0].id;

    console.log(`📝 Creat refund ${refundId} pentru comanda ${orderId}`);

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: requiresApproval ? 'refund_large_requested' : 'refund_requested',
      entityType: 'refund',
      entityId: refundId,
      message: requiresApproval ? 'Refund mare - necesită aprobare a 2-a persoană' : 'Refund cerut',
      meta: { orderId, amount, reason },
    });

    await logOrderAction({
      orderId,
      actorId: user.id,
      actorRole: user.role,
      action: 'refund',
      meta: { refundId, amount, reason, requiresApproval },
    });

    if (requiresApproval) {
      await logWebhook({
        source: 'refunds',
        ref: orderId,
        payload: { action: 'create_refund', refundId, amount, reason, items, requiresApproval },
        result: 'ok',
      });

      return NextResponse.json({
        success: true,
        refundId,
        status: 'pending',
        approvalRequired: true,
        message: 'Refund-ul a fost înregistrat și așteaptă aprobarea a 2-a persoană',
      }, { status: 202 });
    }

    // Procesează refund-ul
    const result = await processRefundShared(refundId, orderId, amount, order.currency);

    // Log webhook
    await logWebhook({
      source: 'refunds',
      ref: orderId,
      payload: { 
        action: 'create_refund', 
        refundId, 
        amount, 
        reason, 
        items 
      },
      result: result.success ? 'ok' : 'error'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        refundId,
        status: result.status,
        providerRef: result.providerRef,
        message: 'Refund-ul a fost procesat cu succes'
      });
    } else {
      return NextResponse.json({
        success: false,
        refundId,
        status: result.status,
        failureReason: result.failureReason,
        error: 'Refund-ul a eșuat'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Eroare la procesarea refund-ului:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

