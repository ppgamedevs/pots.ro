import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventsRaw } from '@/db/schema/core';
import { z } from 'zod';

// Validation schema for order placed event
const orderPlacedSchema = z.object({
  orderId: z.string().uuid(),
  sellerId: z.string().uuid(),
  revenue: z.number().min(0), // in cents
});

// POST /api/events/order-placed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, sellerId, revenue } = orderPlacedSchema.parse(body);

    // Store raw event for aggregation
    await db.insert(eventsRaw).values({
      eventType: 'order-placed',
      orderId: orderId,
      sellerId: sellerId,
      metadata: {
        timestamp: new Date().toISOString(),
        revenue: revenue,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking order placed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Eroare la înregistrarea evenimentului' },
      { status: 500 }
    );
  }
}
