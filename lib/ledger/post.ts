/**
 * Sistem de jurnal contabil pentru Pots.ro
 * Înregistrează toate tranzacțiile financiare pentru tracking și raportare
 */

import { db } from '@/db';
import { ledger, orders, orderItems, payouts, refunds } from '@/db/schema/core';
import { eq, and, gte, lte, desc, sum } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export type LedgerEntry = {
  type: 'charge' | 'commission' | 'payout' | 'refund' | 'recovery';
  entityId: string;
  entityType: 'order' | 'payout' | 'refund' | 'seller' | 'platform';
  amount: number; // pozitiv = intrare pt. platformă, negativ = ieșire
  currency: string;
  meta?: any;
};

export type LedgerBalance = {
  totalIn: number;
  totalOut: number;
  balance: number;
  currency: string;
};

/**
 * Înregistrează o intrare în jurnal
 */
export async function postLedgerEntry(entry: LedgerEntry): Promise<void> {
  console.log(`📝 Înregistrez în jurnal: ${entry.type} - ${entry.amount} ${entry.currency}`);
  
  await db.insert(ledger).values({
    type: entry.type,
    entityId: entry.entityId,
    entityType: entry.entityType,
    amount: entry.amount.toString(),
    currency: entry.currency,
    meta: entry.meta || null
  });
}

/**
 * Înregistrează tranzacțiile pentru o comandă plătită
 */
export async function recordOrderPaid(orderId: string): Promise<void> {
  console.log(`💰 Înregistrez tranzacțiile pentru comanda plătită ${orderId}`);
  
  // Găsește comanda
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  });

  if (!order) {
    throw new Error(`Comanda ${orderId} nu a fost găsită`);
  }

  // Găsește item-urile comenzii
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId)
  });

  // Calculează totalurile
  const totalAmount = order.totalCents / 100;
  const commissionAmount = items.reduce((sum, item) => sum + item.commissionAmountCents, 0) / 100;

  // Înregistrează CHARGE (total încasat)
  await postLedgerEntry({
    type: 'charge',
    entityId: orderId,
    entityType: 'order',
    amount: totalAmount,
    currency: order.currency,
      meta: {
        orderId: orderId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        itemsCount: items.length
      }
  });

  // Înregistrează COMMISSION (comision platformă)
  await postLedgerEntry({
    type: 'commission',
    entityId: orderId,
    entityType: 'order',
    amount: commissionAmount,
    currency: order.currency,
      meta: {
        orderId: orderId,
        sellerId: order.sellerId,
        commissionRate: items[0]?.commissionPct || 0
      }
  });

  console.log(`✅ Înregistrate tranzacții pentru comanda ${orderId}: CHARGE ${totalAmount}, COMMISSION ${commissionAmount}`);
}

/**
 * Înregistrează tranzacția pentru un payout plătit
 */
export async function recordPayoutPaid(payoutId: string): Promise<void> {
  console.log(`💸 Înregistrez payout-ul plătit ${payoutId}`);
  
  const payout = await db.query.payouts.findFirst({
    where: eq(payouts.id, payoutId)
  });

  if (!payout) {
    throw new Error(`Payout ${payoutId} nu a fost găsit`);
  }

  // Înregistrează PAYOUT (ieșire pentru platformă)
  await postLedgerEntry({
    type: 'payout',
    entityId: payoutId,
    entityType: 'payout',
    amount: -parseFloat(payout.amount), // negativ = ieșire
    currency: payout.currency,
    meta: {
      payoutId: payoutId,
      orderId: payout.orderId,
      sellerId: payout.sellerId,
      providerRef: payout.providerRef
    }
  });

  console.log(`✅ Înregistrat payout ${payoutId}: ${payout.amount} ${payout.currency}`);
}

/**
 * Înregistrează tranzacțiile pentru un refund
 */
export async function recordRefund(refundId: string, wasPostPayout: boolean = false): Promise<void> {
  console.log(`🔄 Înregistrez refund-ul ${refundId} (post-payout: ${wasPostPayout})`);
  
  const refund = await db.query.refunds.findFirst({
    where: eq(refunds.id, refundId)
  });

  if (!refund) {
    throw new Error(`Refund ${refundId} nu a fost găsit`);
  }

  // Înregistrează REFUND (ieșire pentru platformă)
  await postLedgerEntry({
    type: 'refund',
    entityId: refundId,
    entityType: 'refund',
    amount: -parseFloat(refund.amount), // negativ = ieșire
    currency: 'RON', // Default currency since refunds table doesn't have currency field
    meta: {
      refundId: refundId,
      orderId: refund.orderId,
      reason: refund.reason,
      providerRef: refund.providerRef,
      wasPostPayout: wasPostPayout
    }
  });

  // Dacă a fost post-payout, înregistrează RECOVERY
  if (wasPostPayout) {
    await postLedgerEntry({
      type: 'recovery',
      entityId: refundId,
      entityType: 'refund',
      amount: parseFloat(refund.amount), // pozitiv = intrare (recovery)
      currency: 'RON', // Default currency since refunds table doesn't have currency field
      meta: {
        refundId: refundId,
        orderId: refund.orderId,
        type: 'post_payout_recovery'
      }
    });

    console.log(`✅ Înregistrat recovery pentru refund ${refundId}`);
  }

  console.log(`✅ Înregistrat refund ${refundId}: ${refund.amount} RON`);
}

/**
 * Calculează soldul platformei
 */
export async function calculatePlatformBalance(currency: string = 'RON'): Promise<LedgerBalance> {
  console.log(`🧮 Calculez soldul platformei în ${currency}`);
  
  const result = await db
    .select({
      type: ledger.type,
      totalAmount: sum(ledger.amount)
    })
    .from(ledger)
    .where(eq(ledger.currency, currency))
    .groupBy(ledger.type);

  let totalIn = 0;
  let totalOut = 0;

  for (const row of result) {
    const amount = parseFloat(row.totalAmount || '0');
    
    if (amount > 0) {
      totalIn += amount;
    } else {
      totalOut += Math.abs(amount);
    }
  }

  const balance = totalIn - totalOut;

  console.log(`💰 Sold platformă ${currency}: ${balance} (IN: ${totalIn}, OUT: ${totalOut})`);

  return {
    totalIn,
    totalOut,
    balance,
    currency
  };
}

/**
 * Obține istoricul jurnalului pentru o entitate
 */
export async function getEntityLedgerHistory(
  entityId: string,
  entityType: 'order' | 'payout' | 'refund' | 'seller' | 'platform'
): Promise<Array<{
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: Date;
  meta: any;
}>> {
  const entries = await db.query.ledger.findMany({
    where: and(
      eq(ledger.entityId, entityId),
      eq(ledger.entityType, entityType)
    ),
    orderBy: [desc(ledger.createdAt)]
  });

  return entries.map(entry => ({
    id: entry.id,
    type: entry.type,
    amount: parseFloat(entry.amount),
    currency: entry.currency,
    createdAt: entry.createdAt,
    meta: entry.meta
  }));
}

/**
 * Obține raportul financiar pentru o perioadă
 */
export async function getFinancialReport(
  startDate: Date,
  endDate: Date,
  currency: string = 'RON'
): Promise<{
  period: { start: Date; end: Date };
  currency: string;
  summary: LedgerBalance;
  breakdown: Array<{
    type: string;
    count: number;
    totalAmount: number;
  }>;
}> {
  console.log(`📊 Generez raport financiar ${startDate.toISOString()} - ${endDate.toISOString()}`);
  
  const result = await db
    .select({
      type: ledger.type,
      count: sql<number>`count(*)`,
      totalAmount: sum(ledger.amount)
    })
    .from(ledger)
    .where(and(
      eq(ledger.currency, currency),
      gte(ledger.createdAt, startDate),
      lte(ledger.createdAt, endDate)
    ))
    .groupBy(ledger.type);

  let totalIn = 0;
  let totalOut = 0;
  const breakdown: Array<{ type: string; count: number; totalAmount: number }> = [];

  for (const row of result) {
    const amount = parseFloat(row.totalAmount || '0');
    const count = row.count;
    
    breakdown.push({
      type: row.type,
      count,
      totalAmount: amount
    });

    if (amount > 0) {
      totalIn += amount;
    } else {
      totalOut += Math.abs(amount);
    }
  }

  const balance = totalIn - totalOut;

  return {
    period: { start: startDate, end: endDate },
    currency,
    summary: {
      totalIn,
      totalOut,
      balance,
      currency
    },
    breakdown
  };
}

/**
 * Verifică integritatea jurnalului (pentru debugging)
 */
export async function verifyLedgerIntegrity(): Promise<{
  valid: boolean;
  issues: string[];
  balance: LedgerBalance;
}> {
  console.log(`🔍 Verific integritatea jurnalului`);
  
  const issues: string[] = [];
  
  // Calculează soldul total
  const balance = await calculatePlatformBalance();
  
  // Verifică dacă soldul este pozitiv (platforma ar trebui să aibă profit)
  if (balance.balance < 0) {
    issues.push(`Soldul platformei este negativ: ${balance.balance} ${balance.currency}`);
  }

  // Verifică dacă există tranzacții fără entități asociate
  const orphanEntries = await db
    .select({ count: sql<number>`count(*)` })
    .from(ledger)
    .where(sql`entity_id IS NULL OR entity_type IS NULL`);

  if (orphanEntries[0]?.count > 0) {
    issues.push(`Există ${orphanEntries[0].count} intrări în jurnal fără entitate asociată`);
  }

  return {
    valid: issues.length === 0,
    issues,
    balance
  };
}
