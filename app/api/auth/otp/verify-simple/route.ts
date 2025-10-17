import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Simple validation schema
const otpVerifySchema = z.object({
  email: z.string().email('Email invalid'),
  code: z.string().length(6, 'Codul trebuie să aibă 6 cifre'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[otp-simple] Starting simple OTP verification');
    
    const body = await request.json();
    console.log('[otp-simple] Request body:', body);
    
    const { email, code } = otpVerifySchema.parse(body);
    console.log('[otp-simple] Parsed data:', { email, code });
    
    // Simple response without database operations
    return NextResponse.json({ 
      success: true, 
      message: 'OTP verification would succeed',
      email: email,
      code: code
    });
    
  } catch (error) {
    console.error('[otp-simple] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare internă', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
