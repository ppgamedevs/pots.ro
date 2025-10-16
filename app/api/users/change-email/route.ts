import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema
const changeEmailSchema = z.object({
  newEmail: z.string().email('Email-ul nou nu este valid'),
  currentPassword: z.string().min(1, 'Parola actuală este obligatorie'),
});

/**
 * POST /api/users/change-email
 * Change user email address
 */
export async function POST(request: NextRequest) {
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
    const validatedData = changeEmailSchema.parse(body);

    // Get user with password for verification
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    const dbUser = userRecord[0];

    // Check if user has a password set
    if (!dbUser.password) {
      return NextResponse.json(
        { error: 'Pentru a schimba email-ul, trebuie să ai o parolă setată' },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, dbUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Parola actuală este incorectă' },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.newEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Acest email este deja folosit' },
        { status: 400 }
      );
    }

    // Update email in database
    const updatedUser = await db
      .update(users)
      .set({
        email: validatedData.newEmail,
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
        { error: 'Eroare la actualizarea email-ului' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
      message: 'Email-ul a fost actualizat cu succes',
    });

  } catch (error) {
    console.error('Error changing email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare la schimbarea email-ului' },
      { status: 500 }
    );
  }
}
