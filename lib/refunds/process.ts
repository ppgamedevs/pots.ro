import { db } from '@/db';
import { payouts, refunds } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { retryWithLogging, isRefundRetryableError } from '@/lib/util/retry';
import { recordRefund } from '@/lib/ledger/post';
import { emailService } from '@/lib/email';
import React from 'react';
import { getAdminAlertRecipients } from '@/lib/alerts/recipients';

/**
 * Processes a refund (mock provider for MVP).
 * Kept as a shared helper so admin approval can trigger the same flow.
 */
export async function processRefund(
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
    await db.update(refunds).set({ status: 'processing' }).where(eq(refunds.id, refundId));

    const orderPayouts = await db.query.payouts.findMany({ where: eq(payouts.orderId, orderId) });
    const wasPostPayout = orderPayouts.some((p: any) => p.status === 'paid');

    const result = await retryWithLogging(
      `Refund ${refundId}`,
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
        if (Math.random() < 0.05) {
          throw new Error('Eroare simulată de procesare refund');
        }
        return {
          ok: true,
          providerRef: `REFUND-${refundId}-${Date.now()}`,
          failureReason: undefined,
        };
      },
      {
        retryCondition: isRefundRetryableError,
        maxAttempts: 3,
      }
    );

    if (result.ok) {
      await db
        .update(refunds)
        .set({
          status: 'refunded',
          providerRef: result.providerRef,
          failureReason: null,
        })
        .where(eq(refunds.id, refundId));

      await recordRefund(refundId, wasPostPayout);

      return { success: true, status: 'refunded', providerRef: result.providerRef };
    }

    await db
      .update(refunds)
      .set({
        status: 'failed',
        failureReason: result.failureReason || 'Eroare necunoscută',
      })
      .where(eq(refunds.id, refundId));

    await sendRefundFailureAlert(refundId, result.failureReason || 'Eroare necunoscută');
    return { success: false, status: 'failed', failureReason: result.failureReason };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    await db
      .update(refunds)
      .set({
        status: 'failed',
        failureReason: errorMessage,
      })
      .where(eq(refunds.id, refundId));

    await sendRefundFailureAlert(refundId, errorMessage);
    return { success: false, status: 'failed', failureReason: errorMessage };
  }
}

async function sendRefundFailureAlert(refundId: string, reason: string): Promise<void> {
  try {
    const adminEmails = await getAdminAlertRecipients();

    for (const email of adminEmails) {
      await emailService.sendEmail({
        to: email.trim(),
        subject: `🚨 Refund eșuat - ${refundId}`,
        template: React.createElement(
          'div',
          {
            style: {
              fontFamily: 'Arial, sans-serif',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '20px',
            },
          },
          [
            React.createElement('h2', { key: 'title', style: { color: '#d32f2f' } }, 'Refund eșuat'),
            React.createElement('p', { key: 'refund-id' }, `Refund ID: ${refundId}`),
            React.createElement('p', { key: 'reason' }, `Motiv: ${reason}`),
            React.createElement('p', { key: 'date' }, `Data: ${new Date().toLocaleString('ro-RO')}`),
            React.createElement('p', { key: 'action' }, 'Te rugăm să investighezi și să rezolvi problema.'),
          ]
        ),
      });
    }
  } catch (err) {
    console.error('Eroare la trimiterea email-ului de alertă refund:', err);
  }
}
