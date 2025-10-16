import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parola actuală este obligatorie'),
  newPassword: z.string().min(6, 'Parola nouă trebuie să aibă cel puțin 6 caractere'),
});

/**
 * POST /api/users/change-password
 * Change user password
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
    const validatedData = changePasswordSchema.parse(body);

    // Get user from database with password
    const userWithPassword = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        password: users.password,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userWithPassword.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    const dbUser = userWithPassword[0];

    // Verify current password
    if (!dbUser.password) {
      return NextResponse.json(
        { error: 'Contul nu are parolă setată' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      dbUser.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Parola actuală este incorectă' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password in database
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Parola a fost schimbată cu succes',
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare la schimbarea parolei' },
      { status: 500 }
    );
  }
}
