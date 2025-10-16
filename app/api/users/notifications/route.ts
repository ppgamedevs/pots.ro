import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

// Validation schema
const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  newsletter: z.boolean(),
});

/**
 * PATCH /api/users/notifications
 * Update user notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Neautentificat' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    // Update user notification preferences in database
    const updatedUser = await db
      .update(users)
      .set({
        notificationPreferences: JSON.stringify(validatedData),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        notificationPreferences: users.notificationPreferences,
      });

    if (!updatedUser.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: validatedData,
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare la actualizarea preferințelor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/notifications
 * Get user notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Neautentificat' },
        { status: 401 }
      );
    }

    // Get user notification preferences from database
    const userWithPreferences = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        notificationPreferences: users.notificationPreferences,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userWithPreferences.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    const dbUser = userWithPreferences[0];
    
    // Parse notification preferences or return defaults
    let preferences = {
      emailNotifications: true,
      orderUpdates: true,
      promotions: false,
      newsletter: true,
    };

    if (dbUser.notificationPreferences) {
      try {
        preferences = JSON.parse(dbUser.notificationPreferences);
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    
    return NextResponse.json(
      { error: 'Eroare la încărcarea preferințelor' },
      { status: 500 }
    );
  }
}
