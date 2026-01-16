import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedPaymentCards } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment-cards
 * Fetch saved payment cards for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cards = await db
      .select()
      .from(savedPaymentCards)
      .where(eq(savedPaymentCards.userId, userId))
      .orderBy(savedPaymentCards.createdAt);

    // Remove sensitive data - only return safe card info
    const safeCards = cards.map(card => ({
      id: card.id,
      last4Digits: card.last4Digits,
      brand: card.brand,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cardholderName: card.cardholderName,
      isDefault: card.isDefault,
      createdAt: card.createdAt,
    }));

    return NextResponse.json({ cards: safeCards });
  } catch (error) {
    console.error('Error fetching payment cards:', error);
    return NextResponse.json(
      { error: "Failed to fetch payment cards" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-cards
 * Save a new payment card for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      last4Digits, 
      brand, 
      expiryMonth, 
      expiryYear, 
      cardholderName,
      providerToken,
      isDefault = false 
    } = body;

    // Validation
    if (!last4Digits || !brand || !expiryMonth || !expiryYear) {
      return NextResponse.json(
        { error: "Missing required card fields" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other default cards
    if (isDefault) {
      await db
        .update(savedPaymentCards)
        .set({ isDefault: false })
        .where(
          and(
            eq(savedPaymentCards.userId, userId),
            eq(savedPaymentCards.isDefault, true)
          )
        );
    }

    // Insert new card
    const [newCard] = await db
      .insert(savedPaymentCards)
      .values({
        userId,
        last4Digits: String(last4Digits).slice(-4), // Ensure only last 4 digits
        brand: String(brand).toLowerCase(),
        expiryMonth: parseInt(String(expiryMonth), 10),
        expiryYear: parseInt(String(expiryYear), 10),
        cardholderName: cardholderName || null,
        providerToken: providerToken || null,
        isDefault: Boolean(isDefault),
      })
      .returning();

    return NextResponse.json({
      card: {
        id: newCard.id,
        last4Digits: newCard.last4Digits,
        brand: newCard.brand,
        expiryMonth: newCard.expiryMonth,
        expiryYear: newCard.expiryYear,
        cardholderName: newCard.cardholderName,
        isDefault: newCard.isDefault,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving payment card:', error);
    return NextResponse.json(
      { error: "Failed to save payment card" },
      { status: 500 }
    );
  }
}
