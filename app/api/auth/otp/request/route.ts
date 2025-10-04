import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, authOtp } from '@/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { 
  hash, 
  verify, 
  randomOtp, 
  generateMagicToken,
  normalizeEmail,
  isValidEmail,
  getClientIP,
  getUserAgent
} from '@/lib/auth/crypto';
import { 
  createSession, 
  setSessionCookie, 
  logAuthEvent 
} from '@/lib/auth/session';
import { 
  checkRateLimit, 
  incrementOtpAttempts,
  isDisposableEmail 
} from '@/lib/auth/rateLimit';
import { 
  sendOtpEmail, 
  generateMagicLink,
  sendWelcomeEmail 
} from '@/lib/auth/email';

// Validation schemas
const otpRequestSchema = z.object({
  email: z.string().email('Email invalid'),
});

const otpVerifySchema = z.object({
  email: z.string().email('Email invalid'),
  code: z.string().length(6, 'Codul trebuie să aibă 6 cifre'),
});

/**
 * POST /api/auth/otp/request
 * Request OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = otpRequestSchema.parse(body);
    
    const normalizedEmail = normalizeEmail(email);
    const ip = getClientIP(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    // Validate email
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Email invalid' },
        { status: 400 }
      );
    }
    
    // Check for disposable email
    if (isDisposableEmail(normalizedEmail)) {
      await logAuthEvent('rate_limit', normalizedEmail, undefined, ip, userAgent, {
        type: 'disposable_email',
      });
      
      return NextResponse.json(
        { error: 'Email-uri temporare nu sunt permise' },
        { status: 400 }
      );
    }
    
    // Check rate limits
    const rateLimitResult = await checkRateLimit(request, 'otp_request', normalizedEmail);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.reason || 'Prea multe cereri',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      );
    }
    
    // Generate OTP and magic token
    const code = randomOtp();
    const magicToken = generateMagicToken();
    const codeHash = await hash(code);
    const magicTokenHash = await hash(magicToken);
    
    // Set expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store OTP in database
    await db.insert(authOtp).values({
      email: normalizedEmail,
      codeHash,
      magicTokenHash,
      expiresAt,
      ip,
      userAgent,
    });
    
    // Generate magic link
    const magicUrl = generateMagicLink(magicToken, normalizedEmail);
    
    // Send email
    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      code,
      magicUrl,
    });
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return NextResponse.json(
        { error: 'Eroare la trimiterea email-ului' },
        { status: 500 }
      );
    }
    
    // Log successful request
    await logAuthEvent('otp_request', normalizedEmail, undefined, ip, userAgent);
    
    // Always return success (don't reveal if user exists)
    return NextResponse.json({ 
      ok: true,
      message: 'Codul a fost trimis pe email'
    });
    
  } catch (error) {
    console.error('OTP request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
