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
    console.log('OTP request started');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email } = otpRequestSchema.parse(body);
    console.log('Parsed email:', email);
    
    const normalizedEmail = normalizeEmail(email);
    const ip = getClientIP(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    console.log('Normalized email:', normalizedEmail);
    
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
    console.log('Generating OTP and magic token');
    const code = randomOtp();
    const magicToken = generateMagicToken();
    console.log('Generated code:', code);
    
    const codeHash = await hash(code);
    const magicTokenHash = await hash(magicToken);
    console.log('Hashed tokens');
    
    // Set expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store OTP in database
    console.log('Storing OTP in database');
    try {
      await db.insert(authOtp).values({
        email: normalizedEmail,
        codeHash,
        magicTokenHash,
        expiresAt,
        ip,
        userAgent,
      });
      console.log('OTP stored successfully');
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If table doesn't exist, create it
      if (dbError instanceof Error && dbError.message.includes('relation "auth_otp" does not exist')) {
        console.log('Creating auth_otp table');
        await db.execute(`
          CREATE TABLE IF NOT EXISTS auth_otp (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            magic_token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            consumed_at TIMESTAMPTZ,
            ip TEXT,
            ua TEXT,
            attempts INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        
        await db.execute(`
          CREATE INDEX IF NOT EXISTS auth_otp_email_expires_idx ON auth_otp(email, expires_at)
        `);
        
        // Try inserting again
        await db.insert(authOtp).values({
          email: normalizedEmail,
          codeHash,
          magicTokenHash,
          expiresAt,
          ip,
          userAgent,
        });
        console.log('OTP stored successfully after creating table');
      } else {
        throw dbError;
      }
    }
    
    // Generate magic link
    const magicUrl = generateMagicLink(magicToken, normalizedEmail);
    
    // Send email
    console.log('Sending OTP email');
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
    console.log('Email sent successfully');
    
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
