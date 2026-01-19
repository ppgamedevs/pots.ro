export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, authOtp } from '@/db/schema/core';
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
import { generateUniqueDisplayId } from '@/lib/utils/displayId';

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
    console.log('[magic] verifying magic link for', normalizedEmail);
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
        console.error('[magic] Error creating auth tables:', error);
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
      // Redirect to friendly UI page
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }
    
    // Verify the magic token
    const isValidToken = await verify(token, otpRecord.magicTokenHash);
    console.log('[magic] token valid?', isValidToken);
    
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
    
    // Find or create user with defensive table creation
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    const isNewUser = !user;
    
    if (!user) {
      try {
        // Create new user
        const displayId = await generateUniqueDisplayId(db, users, normalizedEmail);
        // Set admin role for specific email address
        const userRole = normalizedEmail === 'eccostachescu@gmail.com' ? 'admin' : 'buyer';
        [user] = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            displayId: displayId,
            role: userRole,
          })
          .returning();
      } catch (error) {
        console.error('Error creating user (magic):', error);
        if (error instanceof Error && error.message.includes('relation "users" does not exist')) {
          try {
            await db.execute(`
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL UNIQUE,
                name TEXT,
                display_id TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL DEFAULT 'buyer',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              )
            `);
            await db.execute(`
              CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)
            `);
            await db.execute(`
              CREATE INDEX IF NOT EXISTS users_display_id_idx ON users(display_id)
            `);
            // Retry creating user
            const displayId = await generateUniqueDisplayId(db, users, normalizedEmail);
            // Set admin role for specific email address
            const userRole = normalizedEmail === 'eccostachescu@gmail.com' ? 'admin' : 'buyer';
            [user] = await db
              .insert(users)
              .values({
                email: normalizedEmail,
                displayId: displayId,
                role: userRole,
              })
              .returning();
          } catch (createError) {
            console.error('Error creating users table (magic):', createError);
            throw createError;
          }
        } else {
          throw error;
        }
      }
      
      // Send welcome email for new users (async, don't block)
      sendWelcomeEmail(normalizedEmail).catch(err => {
        console.error('Failed to send welcome email (magic):', err);
      });
    }
    
    // Create session
    const { sessionToken, session } = await createSession(user, request);
    console.log('[magic] session created', session.id);
    
    // Log successful verification
    await logAuthEvent('otp_verify', normalizedEmail, user.id, ip, userAgent, {
      method: 'magic_link',
    });
    await logAuthEvent('login', normalizedEmail, user.id, ip, userAgent, {
      method: 'magic_link',
      isNewUser,
    });
    
    // Create response with redirect and ensure cookie is set for browser navigation
    const response = NextResponse.redirect(new URL('/account', request.url));
    response.headers.set('Cache-Control', 'no-store');
    
    // Set session cookie
    await setSessionCookie(response, sessionToken, user);
    
    return response;
    
  } catch (error) {
    console.error('[magic] Magic link error:', error);
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
