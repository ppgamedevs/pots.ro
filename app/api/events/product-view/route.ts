import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventsRaw } from '@/db/schema/core';
import { z } from 'zod';

// Validation schema for product view event
const productViewSchema = z.object({
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
});

// POST /api/events/product-view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, sellerId } = productViewSchema.parse(body);

    // Store raw event for aggregation
    await db.insert(eventsRaw).values({
      eventType: 'product-view',
      productId: productId,
      sellerId: sellerId,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking product view:', error);
    
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
