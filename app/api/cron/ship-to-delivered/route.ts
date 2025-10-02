/**
 * Cron job pentru tranziția automată SHIPPED → DELIVERED
 * Rulează zilnic la 6:00 AM pentru a marca comenzile ca livrate după 3 zile
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, payouts } from '@/db/schema/core';
import { eq, and, lte } from 'drizzle-orm';
import { createPayoutsForDeliveredOrder } from '@/lib/payouts/run';
import { emit } from '@/lib/events/bus';

export async function GET(req: NextRequest) {
  try {
    // Verifică dacă este un cron job valid
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚚 Starting ship-to-delivered cron job...');

    // Calculează data de acum 3 zile
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Găsește comenzile SHIPPED cu updatedAt <= acum 3 zile
    const shippedOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'shipped'),
          lte(orders.updatedAt, threeDaysAgo)
        )
      );

    console.log(`📦 Found ${shippedOrders.length} orders to mark as delivered`);

    let processedCount = 0;
    let payoutCount = 0;
    const errors: string[] = [];

    // Procesează fiecare comandă
    for (const order of shippedOrders) {
      try {
        // Marchează comanda ca DELIVERED
        await db
          .update(orders)
          .set({
            status: 'delivered',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`✅ Order ${order.id} marked as delivered`);

        // Creează payout-uri pentru comanda livrată
        try {
          await createPayoutsForDeliveredOrder(order.id);
          payoutCount += 1; // Simulăm că se creează cel puțin un payout
          
          console.log(`💰 Created payouts for order ${order.id}`);
          
          // Emite eveniment pentru payout creat (simplificat)
          emit('payout_ready', {
            orderId: order.id,
            payoutId: `payout_${order.id}`, // ID simplificat
            sellerId: order.sellerId || 'unknown',
          });
        } catch (payoutError) {
          console.error(`❌ Failed to create payouts for order ${order.id}:`, payoutError);
          errors.push(`Payout creation failed for order ${order.id}: ${payoutError}`);
        }

        // Emite eveniment pentru livrare
        emit('order_delivered', {
          orderId: order.id,
        });

        processedCount++;

      } catch (error) {
        console.error(`❌ Failed to process order ${order.id}:`, error);
        errors.push(`Order ${order.id}: ${error}`);
      }
    }

    const result = {
      success: true,
      message: 'Ship-to-delivered cron job completed',
      processed: processedCount,
      payoutsCreated: payoutCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('🎉 Cron job completed:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Pentru testing - permite și POST requests
export async function POST(req: NextRequest) {
  return GET(req);
}
