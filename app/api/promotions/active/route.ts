import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema/core';
import { and, eq, gte, lte, isNull, or } from 'drizzle-orm';

// GET /api/promotions/active
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');
    const productId = searchParams.get('productId');

    const now = new Date();

    // Build query conditions
    const conditions = [
      eq(promotions.active, true),
      eq(promotions.type, 'banner'),
      lte(promotions.startAt, now),
      gte(promotions.endAt, now)
    ];

    // Add targeting conditions
    if (categorySlug) {
      conditions.push(
        or(
          isNull(promotions.targetCategorySlug), // Global banner
          eq(promotions.targetCategorySlug, categorySlug)
        )!
      );
    }

    if (sellerId) {
      conditions.push(
        or(
          isNull(promotions.sellerId), // Global banner
          eq(promotions.sellerId, sellerId)
        )!
      );
    }

    if (productId) {
      conditions.push(
        or(
          isNull(promotions.targetProductId), // Not product-specific
          eq(promotions.targetProductId, productId)
        )!
      );
    }

    // Get the most relevant banner (prioritize targeted over global)
    const banners = await db
      .select()
      .from(promotions)
      .where(and(...conditions))
      .orderBy(
        // Prioritize targeted banners first, then by creation date
        promotions.targetCategorySlug,
        promotions.targetProductId,
        promotions.sellerId,
        promotions.createdAt
      )
      .limit(1);

    if (banners.length === 0) {
      return NextResponse.json({ banner: null });
    }

    const banner = banners[0];
    
    return NextResponse.json({
      banner: {
        id: banner.id,
        title: banner.title,
        type: banner.type,
        startAt: banner.startAt.toISOString(),
        endAt: banner.endAt.toISOString(),
        targetCategorySlug: banner.targetCategorySlug,
        targetProductId: banner.targetProductId,
        sellerId: banner.sellerId
      }
    });

  } catch (error) {
    console.error('Error fetching active promotions:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea promoțiilor' },
      { status: 500 }
    );
  }
}
