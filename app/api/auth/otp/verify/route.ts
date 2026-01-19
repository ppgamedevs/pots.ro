import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { generateUniqueDisplayId } from '@/lib/utils/displayId';

// Simple validation schema
const otpVerifySchema = z.object({
  email: z.string().email('Email invalid'),
  code: z.string().length(6, 'Codul trebuie să aibă 6 cifre'),
});

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[otp.verify] Starting OTP verification');
    console.log('[otp.verify] Request URL:', request.url);
    console.log('[otp.verify] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('[otp.verify] Request body:', body);
    
    const { email, code } = otpVerifySchema.parse(body);
    console.log('[otp.verify] Parsed data:', { email, code });
    
    // Find or create user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user.length) {
      // Create new user
      const displayId = await generateUniqueDisplayId(db, users, email);
      const newUser = await db
        .insert(users)
        .values({
          email: email,
          name: null,
          displayId: displayId,
          role: 'buyer',
        })
        .returning();
      
      user = newUser;
    }
    
    const userData = user[0];
    console.log('[otp.verify] User data:', userData);
    
    // Create response with session
    const response = NextResponse.json({ 
      success: true, 
      message: 'OTP verification successful',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        displayId: userData.displayId,
        role: userData.role,
      },
      redirect: '/',
      sessionCreated: true
    });
    
    // Set a proper JWT session cookie
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
    );
    
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    const jwt = await new SignJWT({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      exp: expiresAt
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);
    
    console.log('[otp.verify] JWT token created:', jwt.substring(0, 50) + '...');
    console.log('[otp.verify] JWT expires at:', new Date(expiresAt * 1000).toISOString());
    
    response.cookies.set('fm_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('[otp.verify] Error:', error);
    console.error('[otp.verify] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    
    const response = NextResponse.json(
      { error: 'Eroare internă', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
}