import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { promotions, sellers } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';

// PATCH /api/promotions/[id] - Update promotion (toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, (session.user as any).id)
    });

    if (!seller) {
      return NextResponse.json({ error: 'Nu sunteți vânzător' }, { status: 403 });
    }

    const promotionId = params.id;
    const body = await request.json();
    const { active } = body;

    // Update promotion
    const [updatedPromotion] = await db
      .update(promotions)
      .set({
        active: active,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(promotions.id, promotionId),
          eq(promotions.sellerId, seller.id)
        )
      )
      .returning();

    if (!updatedPromotion) {
      return NextResponse.json(
        { error: 'Promoția nu a fost găsită' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      promotion: {
        id: updatedPromotion.id,
        title: updatedPromotion.title,
        type: updatedPromotion.type,
        percent: updatedPromotion.percent,
        value: updatedPromotion.value,
        startAt: updatedPromotion.startAt.toISOString(),
        endAt: updatedPromotion.endAt.toISOString(),
        active: updatedPromotion.active,
        targetCategorySlug: updatedPromotion.targetCategorySlug,
        targetProductId: updatedPromotion.targetProductId,
        updatedAt: updatedPromotion.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Eroare la actualizarea promoției' },
      { status: 500 }
    );
  }
}

// DELETE /api/promotions/[id] - Delete promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, (session.user as any).id)
    });

    if (!seller) {
      return NextResponse.json({ error: 'Nu sunteți vânzător' }, { status: 403 });
    }

    const promotionId = params.id;

    // Delete promotion
    const [deletedPromotion] = await db
      .delete(promotions)
      .where(
        and(
          eq(promotions.id, promotionId),
          eq(promotions.sellerId, seller.id)
        )
      )
      .returning();

    if (!deletedPromotion) {
      return NextResponse.json(
        { error: 'Promoția nu a fost găsită' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Promoția a fost ștearsă cu succes'
    });

  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Eroare la ștergerea promoției' },
      { status: 500 }
    );
  }
}
