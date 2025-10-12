import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, authOtp } from '@/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { 
  hash, 
  verify, 
  normalizeEmail,
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
  incrementOtpAttempts
} from '@/lib/auth/rateLimit';
import { sendWelcomeEmail } from '@/lib/auth/email';

// Validation schema
const otpVerifySchema = z.object({
  email: z.string().email('Email invalid'),
  code: z.string().length(6, 'Codul trebuie să aibă 6 cifre'),
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = otpVerifySchema.parse(body);
    
    const normalizedEmail = normalizeEmail(email);
    const ip = getClientIP(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    // Check rate limits
    const rateLimitResult = await checkRateLimit(request, 'otp_verify', normalizedEmail);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.reason || 'Prea multe încercări',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      );
    }
    
    // Find the latest valid OTP record
    let [otpRecord] = await db
      .select()
      .from(authOtp)
      .where(eq(authOtp.email, normalizedEmail))
      .orderBy(desc(authOtp.createdAt))
      .limit(1);
    
    // If no record found, try to create tables and retry
    if (!otpRecord) {
      try {
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
        
        // Retry the query
        [otpRecord] = await db
          .select()
          .from(authOtp)
          .where(eq(authOtp.email, normalizedEmail))
          .orderBy(desc(authOtp.createdAt))
          .limit(1);
      } catch (error) {
        console.error('Error creating auth tables:', error);
      }
    }
    
    if (!otpRecord) {
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'no_otp_record',
      });
      
      return NextResponse.json(
        { error: 'Cod invalid sau expirat' },
        { status: 400 }
      );
    }
    
    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await logAuthEvent('otp_expired', normalizedEmail, undefined, ip, userAgent);
      
      return NextResponse.json(
        { error: 'Codul a expirat' },
        { status: 400 }
      );
    }
    
    // Check if OTP is already consumed
    if (otpRecord.consumedAt) {
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'already_consumed',
      });
      
      return NextResponse.json(
        { error: 'Codul a fost deja folosit' },
        { status: 400 }
      );
    }
    
    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'too_many_attempts',
        attempts: otpRecord.attempts,
      });
      
      return NextResponse.json(
        { error: 'Prea multe încercări. Solicită un cod nou.' },
        { status: 400 }
      );
    }
    
    // Verify the code
    console.log('Verifying code:', code);
    console.log('Against hash:', otpRecord.codeHash);
    const isValidCode = await verify(code, otpRecord.codeHash);
    console.log('Verification result:', isValidCode);
    
    if (!isValidCode) {
      // Increment attempts
      await incrementOtpAttempts(normalizedEmail);
      
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'invalid_code',
        attempts: otpRecord.attempts + 1,
      });
      
      return NextResponse.json(
        { error: 'Cod invalid' },
        { status: 400 }
      );
    }
    
    // Mark OTP as consumed
    await db
      .update(authOtp)
      .set({ consumedAt: new Date() })
      .where(eq(authOtp.id, otpRecord.id));
    
    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    const isNewUser = !user;
    
    if (!user) {
      try {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            role: 'buyer',
          })
          .returning();
      } catch (error) {
        console.error('Error creating user:', error);
        
        // If users table doesn't exist, create it
        if (error instanceof Error && error.message.includes('relation "users" does not exist')) {
          try {
            await db.execute(`
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL UNIQUE,
                name TEXT,
                role TEXT NOT NULL DEFAULT 'buyer',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              )
            `);
            
            await db.execute(`
              CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)
            `);
            
            // Retry creating user
            [user] = await db
              .insert(users)
              .values({
                email: normalizedEmail,
                role: 'buyer',
              })
              .returning();
          } catch (createError) {
            console.error('Error creating users table:', createError);
            throw createError;
          }
        } else {
          throw error;
        }
      }
      
      // Send welcome email asynchronously (don't block login)
      sendWelcomeEmail(normalizedEmail).catch(error => {
        console.error('Failed to send welcome email:', error);
        // Don't fail the login if welcome email fails
      });
    }
    
    // Create session
    const { sessionToken, session } = await createSession(user, request);
    
    // Create response
    const response = NextResponse.json({
      ok: true,
      redirect: '/dashboard',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      isNewUser,
    });
    
    // Set session cookie
    setSessionCookie(response, sessionToken);
    
    // Log successful verification asynchronously
    Promise.all([
      logAuthEvent('otp_verify', normalizedEmail, user.id, ip, userAgent),
      logAuthEvent('login', normalizedEmail, user.id, ip, userAgent, {
        method: 'otp',
        isNewUser,
      })
    ]).catch(error => {
      console.error('Failed to log auth events:', error);
      // Don't fail the login if logging fails
    });
    
    return response;
    
  } catch (error) {
    console.error('OTP verify error:', error);
    
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
