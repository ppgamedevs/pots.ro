import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { promotions, sellers } from '@/db/schema/core';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for promotion creation
const createPromotionSchema = z.object({
  title: z.string().min(1, 'Titlul este obligatoriu'),
  type: z.enum(['banner', 'discount']),
  percent: z.number().min(0).max(100).optional(),
  value: z.number().min(0).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  targetCategorySlug: z.string().optional(),
  targetProductId: z.string().uuid().optional(),
}).refine(data => {
  // Either percent or value must be set for discount type
  if (data.type === 'discount') {
    return data.percent !== undefined || data.value !== undefined;
  }
  return true;
}, {
  message: 'Pentru reduceri, specificați procentul sau valoarea'
});

// GET /api/promotions - List promotions for seller
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, session.user.id)
    });

    if (!seller) {
      return NextResponse.json({ error: 'Nu sunteți vânzător' }, { status: 403 });
    }

    const sellerPromotions = await db
      .select()
      .from(promotions)
      .where(eq(promotions.sellerId, seller.id))
      .orderBy(desc(promotions.createdAt));

    return NextResponse.json({
      promotions: sellerPromotions.map((promo: any) => ({
        id: promo.id,
        title: promo.title,
        type: promo.type,
        percent: promo.percent,
        value: promo.value,
        startAt: promo.startAt.toISOString(),
        endAt: promo.endAt.toISOString(),
        active: promo.active,
        targetCategorySlug: promo.targetCategorySlug,
        targetProductId: promo.targetProductId,
        createdAt: promo.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea promoțiilor' },
      { status: 500 }
    );
  }
}

// POST /api/promotions - Create new promotion
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, session.user.id)
    });

    if (!seller) {
      return NextResponse.json({ error: 'Nu sunteți vânzător' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createPromotionSchema.parse(body);

    // Convert value to cents if provided
    const valueInCents = validatedData.value ? Math.round(validatedData.value * 100) : undefined;

    const [promotion] = await db
      .insert(promotions)
      .values({
        title: validatedData.title,
        type: validatedData.type,
        percent: validatedData.percent,
        value: valueInCents,
        startAt: new Date(validatedData.startAt),
        endAt: new Date(validatedData.endAt),
        active: true,
        sellerId: seller.id,
        targetCategorySlug: validatedData.targetCategorySlug || null,
        targetProductId: validatedData.targetProductId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      promotion: {
        id: promotion.id,
        title: promotion.title,
        type: promotion.type,
        percent: promotion.percent,
        value: promotion.value,
        startAt: promotion.startAt.toISOString(),
        endAt: promotion.endAt.toISOString(),
        active: promotion.active,
        targetCategorySlug: promotion.targetCategorySlug,
        targetProductId: promotion.targetProductId,
        createdAt: promotion.createdAt.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating promotion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Eroare la crearea promoției' },
      { status: 500 }
    );
  }
}
