import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Numele este obligatoriu').max(100, 'Numele este prea lung').optional(),
});

/**
 * PATCH /api/users/profile
 * Update user profile information
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
    const validatedData = updateProfileSchema.parse(body);

    // Update user in database
    const updatedUser = await db
      .update(users)
      .set({
        name: validatedData.name,
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    if (!updatedUser.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare la actualizarea profilului' },
      { status: 500 }
    );
  }
}
