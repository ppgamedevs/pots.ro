import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds, orders, orderItems, payouts, ledger } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';
import { retryWithLogging, isRefundRetryableError } from '@/lib/util/retry';
import { recordRefund } from '@/lib/ledger/post';
import { logWebhook } from '@/lib/webhook-logging';
import { emailService } from '@/lib/email';
import React from 'react';

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

    // TODO: Verifică autentificarea admin
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    // }

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

    // Creează refund-ul
    const refund = await db.insert(refunds).values({
      orderId: orderId,
      amount: amount.toString(),
      reason: reason,
      status: 'pending'
    }).returning();

    const refundId = refund[0].id;

    console.log(`📝 Creat refund ${refundId} pentru comanda ${orderId}`);

    // Procesează refund-ul
    const result = await processRefund(refundId, orderId, amount, order.currency);

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

/**
 * Procesează un refund prin provider
 */
async function processRefund(
  refundId: string,
  orderId: string,
  amount: number,
  currency: string
): Promise<{
  success: boolean;
  status: 'pending' | 'processing' | 'refunded' | 'failed';
  providerRef?: string;
  failureReason?: string;
}> {
  try {
    // Marchează ca fiind în procesare
    await db.update(refunds)
      .set({ status: 'processing' })
      .where(eq(refunds.id, refundId));

    console.log(`📤 Procesez refund ${refundId} prin provider`);

    // Verifică dacă există payout-uri pentru această comandă
    const orderPayouts = await db.query.payouts.findMany({
      where: eq(payouts.orderId, orderId)
    });

    const wasPostPayout = orderPayouts.some((p: any) => p.status === 'paid');

    // Procesează refund-ul prin provider (mock pentru MVP)
    const result = await retryWithLogging(
      `Refund ${refundId}`,
      async () => {
        // Simulează procesarea prin provider
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulează eroare ocazională (5% șanse)
        if (Math.random() < 0.05) {
          throw new Error('Eroare simulată de procesare refund');
        }
        
        return {
          ok: true,
          providerRef: `REFUND-${refundId}-${Date.now()}`,
          failureReason: undefined
        };
      },
      {
        retryCondition: isRefundRetryableError,
        maxAttempts: 3
      }
    );

    if (result.ok) {
      // Refund reușit
      await db.update(refunds)
        .set({
          status: 'refunded',
          providerRef: result.providerRef
        })
        .where(eq(refunds.id, refundId));

      // Înregistrează în ledger
      await recordRefund(refundId, wasPostPayout);

      console.log(`✅ Refund ${refundId} procesat cu succes: ${result.providerRef}`);

      return {
        success: true,
        status: 'refunded',
        providerRef: result.providerRef
      };
    } else {
      // Refund eșuat
      await db.update(refunds)
        .set({
          status: 'failed',
          failureReason: result.failureReason || 'Eroare necunoscută'
        })
        .where(eq(refunds.id, refundId));

      // Trimite email de alertă către admin
      await sendRefundFailureAlert(refundId, result.failureReason || 'Eroare necunoscută');

      console.log(`❌ Refund ${refundId} eșuat: ${result.failureReason}`);

      return {
        success: false,
        status: 'failed',
        failureReason: result.failureReason
      };
    }
  } catch (error) {
    // Eroare în procesare
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    await db.update(refunds)
      .set({
        status: 'failed',
        failureReason: errorMessage
      })
      .where(eq(refunds.id, refundId));

    // Trimite email de alertă către admin
    await sendRefundFailureAlert(refundId, errorMessage);

    console.log(`❌ Refund ${refundId} eșuat cu excepție: ${errorMessage}`);

    return {
      success: false,
      status: 'failed',
      failureReason: errorMessage
    };
  }
}

/**
 * Trimite email de alertă când un refund eșuează
 */
async function sendRefundFailureAlert(refundId: string, reason: string): Promise<void> {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@floristmarket.ro'];
    
    for (const email of adminEmails) {
      await emailService.sendEmail({
        to: email.trim(),
        subject: `🚨 Refund eșuat - ${refundId}`,
        template: React.createElement('div', {
          style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }
        }, [
          React.createElement('h2', { key: 'title', style: { color: '#d32f2f' } }, 'Refund eșuat'),
          React.createElement('p', { key: 'refund-id' }, `Refund ID: ${refundId}`),
          React.createElement('p', { key: 'reason' }, `Motiv: ${reason}`),
          React.createElement('p', { key: 'date' }, `Data: ${new Date().toLocaleString('ro-RO')}`),
          React.createElement('p', { key: 'action' }, 'Te rugăm să investighezi și să rezolvi problema.')
        ])
      });
    }
  } catch (error) {
    console.error('Eroare la trimiterea email-ului de alertă refund:', error);
  }
}
