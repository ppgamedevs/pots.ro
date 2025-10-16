export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, authOtp } from '@/db/schema/core';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
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
    console.log('[otp.verify] incoming', { email });
    
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
        console.error('[otp.verify] Error creating auth tables:', error);
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
    console.log('[otp.verify] Verifying code for', normalizedEmail);
    const isValidCode = await verify(code, otpRecord.codeHash);
    console.log('[otp.verify] result', isValidCode);
    
    if (!isValidCode) {
      console.log('[otp.verify] Code verification failed');
      // Increment attempts
      await incrementOtpAttempts(normalizedEmail);
      
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'invalid_code',
        attempts: otpRecord.attempts + 1,
      });
      
      return NextResponse.json(
        { error: 'Codul este incorect' },
        { status: 400 }
      );
    }
    
    console.log('[otp.verify] Code verification successful, proceeding with user creation/login');
    
    // Mark OTP as consumed
    await db
      .update(authOtp)
      .set({ consumedAt: new Date() })
      .where(eq(authOtp.id, otpRecord.id));
    
    // Find or create user
    console.log('[otp.verify] Looking for user with email:', normalizedEmail);
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    console.log('[otp.verify] User query result:', user ? 'found' : 'not found');
    const isNewUser = !user;
    
    if (!user) {
      console.log('[otp.verify] Creating new user for:', normalizedEmail);
      try {
        // Create new user with explicit column specification
        console.log('[otp.verify] Attempting to insert user with email:', normalizedEmail);
        const insertResult = await db.execute(sql`
          INSERT INTO users (email, role, name) 
          VALUES (${normalizedEmail}, ${'buyer'}, ${null}) 
          RETURNING id, email, name, role, created_at
        `);
        
        console.log('[otp.verify] Insert result:', insertResult.rows);
        user = insertResult.rows[0] as any;
        console.log('[otp.verify] New user created successfully:', user.id);
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
    console.log('[otp.verify] Creating session for user:', user.id);
    console.log('[otp.verify] User object:', { id: user.id, email: user.email, role: user.role });
    console.log('[otp.verify] About to call createSession...');
    
    let sessionToken: string;
    let session: any;
    
    try {
      const sessionResult = await createSession(user, request);
      sessionToken = sessionResult.sessionToken;
      session = sessionResult.session;
      console.log('[otp.verify] Session created successfully:', { sessionId: session.id, userId: session.userId });
    } catch (sessionError) {
      console.error('[otp.verify] Error creating session:', sessionError);
      throw sessionError;
    }
    
    // Create JSON response (better for client-side handling)
    const response = NextResponse.json({
      ok: true,
      redirect: user.role === 'admin' ? '/admin' : 
                user.role === 'seller' ? '/seller' : '/account',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      isNewUser,
    });
    
    // Set session cookie
    await setSessionCookie(response, sessionToken, user);
    response.headers.set('Cache-Control', 'no-store');
    
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
    console.error('[otp.verify] error:', error);
    
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
