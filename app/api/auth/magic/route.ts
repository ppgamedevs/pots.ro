import { NextRequest, NextResponse } from 'next/server';
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
import { sendWelcomeEmail } from '@/lib/auth/email';

/**
 * GET /api/auth/magic?t=token&e=email
 * Verify magic link and login
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('t');
    const email = searchParams.get('e');
    
    if (!token || !email) {
      return NextResponse.json(
        { error: 'Link invalid' },
        { status: 400 }
      );
    }
    
    const normalizedEmail = normalizeEmail(email);
    const ip = getClientIP(request.headers);
    const userAgent = getUserAgent(request.headers);
    
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
        method: 'magic_link',
      });
      
      return NextResponse.json(
        { error: 'Link invalid sau expirat' },
        { status: 400 }
      );
    }
    
    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await logAuthEvent('otp_expired', normalizedEmail, undefined, ip, userAgent, {
        method: 'magic_link',
      });
      
      return NextResponse.json(
        { error: 'Linkul a expirat' },
        { status: 400 }
      );
    }
    
    // Check if OTP is already consumed
    if (otpRecord.consumedAt) {
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'already_consumed',
        method: 'magic_link',
      });
      
      return NextResponse.json(
        { error: 'Linkul a fost deja folosit' },
        { status: 400 }
      );
    }
    
    // Verify the magic token
    const isValidToken = await verify(token, otpRecord.magicTokenHash);
    
    if (!isValidToken) {
      await logAuthEvent('otp_denied', normalizedEmail, undefined, ip, userAgent, {
        reason: 'invalid_token',
        method: 'magic_link',
      });
      
      return NextResponse.json(
        { error: 'Link invalid' },
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
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          role: 'buyer',
        })
        .returning();
      
      // Send welcome email for new users
      try {
        await sendWelcomeEmail(normalizedEmail);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail the login if welcome email fails
      }
    }
    
    // Create session
    const { sessionToken, session } = await createSession(user, request);
    
    // Log successful verification
    await logAuthEvent('otp_verify', normalizedEmail, user.id, ip, userAgent, {
      method: 'magic_link',
    });
    await logAuthEvent('login', normalizedEmail, user.id, ip, userAgent, {
      method: 'magic_link',
      isNewUser,
    });
    
    // Create response with redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set session cookie
    setSessionCookie(response, sessionToken);
    
    return response;
    
  } catch (error) {
    console.error('Magic link error:', error);
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
