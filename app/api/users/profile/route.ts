import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reservedNames } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Numele este obligatoriu').max(100, 'Numele este prea lung').optional(),
  displayId: z.string().min(3, 'ID-ul de afișare trebuie să aibă cel puțin 3 caractere').max(50, 'ID-ul de afișare este prea lung').optional(),
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

    // Block reserved names for non-admin users
    if (validatedData.name && user.role !== 'admin') {
      const nameLower = validatedData.name.toLowerCase().trim();
      
      // Check against database reserved names table
      const reserved = await db.query.reservedNames.findFirst({
        where: eq(reservedNames.name, nameLower),
      });
      
      if (reserved) {
        return NextResponse.json(
          { error: 'Acest nume este rezervat. Te rugăm să alegi un alt nume.' },
          { status: 400 }
        );
      }
    }

    // Check if displayId is unique (if provided)
    if (validatedData.displayId) {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.displayId, validatedData.displayId))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== user.id) {
        return NextResponse.json(
          { error: 'Acest ID de afișare este deja folosit' },
          { status: 400 }
        );
      }
    }

    // Update user in database
    const updatedUser = await db
      .update(users)
      .set({
        name: validatedData.name,
        displayId: validatedData.displayId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        displayId: users.displayId,
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
