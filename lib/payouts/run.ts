/**
 * Logică de orchestrare payout pentru Pots.ro
 * Gestionează procesarea payout-urilor individuale și în batch
 */

import { db } from '@/db';
import { payouts, orders, orderItems, sellers, ledger } from '@/db/schema/core';
import { eq, and, lte, desc } from 'drizzle-orm';
import { getPayoutProvider, validatePayoutInput, type PayoutInput } from './provider';
import { retryWithLogging } from '@/lib/util/retry';
import { emailService } from '@/lib/email';
import React from 'react';

export type PayoutRunResult = {
  success: boolean;
  payoutId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  providerRef?: string;
  failureReason?: string;
  paidAt?: Date;
};

/**
 * Procesează un payout individual
 */
export async function runPayout(payoutId: string): Promise<PayoutRunResult> {
  console.log(`🔄 Procesez payout ${payoutId}`);
  
  // Găsește payout-ul în baza de date
  const payout = await db.query.payouts.findFirst({
    where: eq(payouts.id, payoutId),
    with: {
      order: {
        with: {
          seller: true
        }
      }
    }
  });

  if (!payout) {
    throw new Error(`Payout ${payoutId} nu a fost găsit`);
  }

  // Verifică status-ul curent
  if (payout.status === 'paid') {
    return {
      success: true,
      payoutId,
      status: 'paid',
      providerRef: payout.providerRef || undefined,
      paidAt: payout.paidAt || undefined
    };
  }

  if (payout.status === 'processing') {
    return {
      success: false,
      payoutId,
      status: 'processing',
      failureReason: 'Payout-ul este deja în procesare'
    };
  }

  if (payout.status === 'failed') {
    throw new Error(`Payout ${payoutId} a eșuat anterior și nu poate fi reprocesat`);
  }

  // Validează input-ul pentru provider
  const payoutInput: PayoutInput = {
    payoutId: payout.id,
    sellerId: payout.sellerId,
    amount: parseFloat(payout.amount),
    currency: payout.currency as 'RON' | 'EUR'
  };

  const validation = validatePayoutInput(payoutInput);
  if (!validation.valid) {
    throw new Error(`Input invalid pentru payout ${payoutId}: ${validation.error}`);
  }

  try {
    // Marchează ca fiind în procesare
    await db.update(payouts)
      .set({ status: 'processing' })
      .where(eq(payouts.id, payoutId));

    console.log(`📤 Trimite payout ${payoutId} către provider`);

    // Procesează payout-ul prin provider
    const provider = getPayoutProvider();
    const result = await retryWithLogging(
      `Payout ${payoutId}`,
      () => provider.send(payoutInput)
    );

    if (result.ok) {
      // Payout reușit
      const paidAt = new Date();
      
      await db.update(payouts)
        .set({
          status: 'paid',
          providerRef: result.providerRef,
          paidAt: paidAt
        })
        .where(eq(payouts.id, payoutId));

      // Înregistrează în ledger (ieșire pentru platformă)
      await db.insert(ledger).values({
        type: 'payout',
        entityId: payoutId,
        entityType: 'payout',
        amount: `-${payout.amount}`, // negativ = ieșire
        currency: payout.currency,
        meta: {
          sellerId: payout.sellerId,
          orderId: payout.orderId,
          providerRef: result.providerRef
        }
      });

      console.log(`✅ Payout ${payoutId} procesat cu succes: ${result.providerRef}`);

      return {
        success: true,
        payoutId,
        status: 'paid',
        providerRef: result.providerRef,
        paidAt
      };
    } else {
      // Payout eșuat
      await db.update(payouts)
        .set({
          status: 'failed',
          failureReason: result.failureReason
        })
        .where(eq(payouts.id, payoutId));

      // Trimite email de alertă către admin
      await sendPayoutFailureAlert(payoutId, result.failureReason || 'Eroare necunoscută');

      console.log(`❌ Payout ${payoutId} eșuat: ${result.failureReason}`);

      return {
        success: false,
        payoutId,
        status: 'failed',
        failureReason: result.failureReason
      };
    }
  } catch (error) {
    // Eroare în procesare
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    await db.update(payouts)
      .set({
        status: 'failed',
        failureReason: errorMessage
      })
      .where(eq(payouts.id, payoutId));

    // Trimite email de alertă către admin
    await sendPayoutFailureAlert(payoutId, errorMessage);

    console.log(`❌ Payout ${payoutId} eșuat cu excepție: ${errorMessage}`);

    return {
      success: false,
      payoutId,
      status: 'failed',
      failureReason: errorMessage
    };
  }
}

/**
 * Procesează toate payout-urile PENDING pentru o dată specifică
 */
export async function runBatchPayouts(date: string): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: PayoutRunResult[];
}> {
  console.log(`🔄 Procesez payout-uri batch pentru data ${date}`);
  
  const targetDate = new Date(date);
  const results: PayoutRunResult[] = [];
  let successful = 0;
  let failed = 0;

  // Găsește toate payout-urile PENDING cu order.deliveredAt <= date
  const pendingPayouts = await db.query.payouts.findMany({
    where: and(
      eq(payouts.status, 'pending'),
      lte(orders.deliveredAt, targetDate)
    ),
    with: {
      order: true
    }
  });

  console.log(`📋 Găsite ${pendingPayouts.length} payout-uri PENDING pentru procesare`);

  // Procesează fiecare payout
  for (const payout of pendingPayouts) {
    try {
      const result = await runPayout(payout.id);
      results.push(result);
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
      console.error(`❌ Eroare la procesarea payout ${payout.id}:`, errorMessage);
      
      results.push({
        success: false,
        payoutId: payout.id,
        status: 'failed',
        failureReason: errorMessage
      });
      failed++;
    }
  }

  console.log(`✅ Batch payout completat: ${successful} reușite, ${failed} eșuate`);

  return {
    processed: pendingPayouts.length,
    successful,
    failed,
    results
  };
}

/**
 * Creează payout-uri PENDING pentru o comandă livrată
 */
export async function createPayoutsForDeliveredOrder(orderId: string): Promise<void> {
  console.log(`💰 Creez payout-uri pentru comanda livrată ${orderId}`);

  // Găsește comanda
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  });

  if (!order) {
    throw new Error(`Comanda ${orderId} nu a fost găsită`);
  }

  if (order.status !== 'delivered') {
    throw new Error(`Comanda ${orderId} nu este în status DELIVERED`);
  }

  // Găsește item-urile comenzii
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId)
  });

  // Grupează item-urile după sellerId și calculează sumele
  const sellerTotals = new Map<string, { amount: number; commissionAmount: number }>();
  
  for (const item of items) {
    const sellerId = item.sellerId;
    const current = sellerTotals.get(sellerId) || { amount: 0, commissionAmount: 0 };
    
    current.amount += item.sellerDueCents / 100; // Convert to RON
    current.commissionAmount += item.commissionAmountCents / 100;
    
    sellerTotals.set(sellerId, current);
  }

  // Creează payout-uri pentru fiecare seller
  for (const [sellerId, totals] of sellerTotals) {
    if (totals.amount > 0) {
      await db.insert(payouts).values({
        orderId: orderId,
        sellerId: sellerId,
        amount: totals.amount.toString(),
        commissionAmount: totals.commissionAmount.toString(),
        currency: order.currency,
        status: 'pending'
      });

      console.log(`💰 Creat payout pentru seller ${sellerId}: ${totals.amount} RON`);
    }
  }
}

/**
 * Trimite email de alertă când un payout eșuează
 */
async function sendPayoutFailureAlert(payoutId: string, reason: string): Promise<void> {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@pots.ro'];
    
    for (const email of adminEmails) {
      await emailService.sendEmail({
        to: email.trim(),
        subject: `🚨 Payout eșuat - ${payoutId}`,
        template: React.createElement('div', {
          style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }
        }, [
          React.createElement('h2', { key: 'title', style: { color: '#d32f2f' } }, 'Payout eșuat'),
          React.createElement('p', { key: 'payout-id' }, `Payout ID: ${payoutId}`),
          React.createElement('p', { key: 'reason' }, `Motiv: ${reason}`),
          React.createElement('p', { key: 'date' }, `Data: ${new Date().toLocaleString('ro-RO')}`),
          React.createElement('p', { key: 'action' }, 'Te rugăm să investighezi și să rezolvi problema.')
        ])
      });
    }
  } catch (error) {
    console.error('Eroare la trimiterea email-ului de alertă payout:', error);
  }
}
