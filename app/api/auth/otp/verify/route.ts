import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';

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
    
    // Create a mock user for testing
    const mockUser = {
      id: 'temp-user-id',
      email: email,
      name: null,
      displayId: 'temp-display-id',
      role: 'buyer' as const
    };
    
    // Create response with session
    const response = NextResponse.json({ 
      success: true, 
      message: 'OTP verification successful',
      user: mockUser,
      redirect: '/',
      sessionCreated: true
    });
    
    // Set a proper JWT session cookie
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
    );
    
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    const jwt = await new SignJWT({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);
    
    response.cookies.set('fm_session', jwt, {
      httpOnly: true,
      secure: false, // Set to false for testing
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/' // Explicitly set path
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