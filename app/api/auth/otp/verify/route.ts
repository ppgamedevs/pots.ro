import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
    
    // For now, return a mock success response to test the flow
    // TODO: Replace with real database logic once we confirm this works
    const response = NextResponse.json({ 
      success: true, 
      message: 'OTP verification successful',
      user: {
        id: 'temp-user-id',
        email: email,
        name: null,
        displayId: 'temp-display-id',
        role: 'buyer'
      },
      redirect: '/'
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