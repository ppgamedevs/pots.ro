import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users, authAudit } from '@/db/schema/core';
import { eq, and, gt, isNull, lt } from 'drizzle-orm';
import { hash, generateSessionToken, getClientIP, getUserAgent } from './crypto';
import { createMiddlewareSessionToken, verifyMiddlewareSessionToken } from './middleware-session';

// Session configuration
const SESSION_COOKIE_NAME = 'fm_session';
const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string | null;
  displayId: string;
  role: 'buyer' | 'seller' | 'support' | 'admin';
}

export interface Session {
  id: string;
  userId: string;
  user: User;
  expiresAt: Date;
}

/**
 * Create a new session for a user
 */
export async function createSession(
  user: User, 
  request: NextRequest
): Promise<{ sessionToken: string; session: Session }> {
  const sessionToken = generateSessionToken();
  const sessionTokenHash = await hash(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  const ip = getClientIP(request.headers);
  const userAgent = getUserAgent(request.headers);
  
  // Insert session into database with minimal data
  let sessionRecord;
  const generatedSessionId = crypto.randomUUID();
  
  console.log('[createSession] Starting session creation for user:', user.id);
  console.log('[createSession] Generated session ID:', generatedSessionId);
  console.log('[createSession] Session token hash length:', sessionTokenHash.length);
  console.log('[createSession] Expires at:', expiresAt);
  
  try {
    // Prefer explicitly providing an id to avoid DB default issues
    console.log('[createSession] Attempting to insert session with explicit ID:', generatedSessionId);
    console.log('[createSession] Values being inserted:', {
      id: generatedSessionId,
      userId: user.id,
      sessionTokenHash: sessionTokenHash.substring(0, 20) + '...',
      expiresAt,
      ip,
      userAgent: userAgent?.substring(0, 50) + '...',
    });
    
    // Try to insert with explicit ID first
    const insertQuery = db.insert(sessions).values({
      id: generatedSessionId,
      userId: user.id,
      sessionTokenHash,
      expiresAt,
      ip,
      userAgent,
    }).returning({
      id: sessions.id,
      expiresAt: sessions.expiresAt,
    });
    
    console.log('[createSession] Insert query prepared, executing...');
    [sessionRecord] = await insertQuery;
    console.log('[createSession] Session created successfully:', sessionRecord);
  } catch (error) {
    console.log('[createSession] Error occurred:', error);
    console.log('[createSession] Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    // Auto-create sessions table if it doesn't exist, then retry once
    if (error instanceof Error && error.message.includes('relation "sessions" does not exist')) {
      console.log('[createSession] Sessions table does not exist, creating it...');
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            session_token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            ip TEXT,
            ua TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            revoked_at TIMESTAMPTZ
          )
        `);
        await db.execute(`
          CREATE INDEX IF NOT EXISTS sessions_user_id_expires_idx ON sessions(user_id, expires_at)
        `);
        console.log('[createSession] Sessions table created, retrying insert with ID:', generatedSessionId);
        // Retry insert after setting default (and keep explicit id for certainty)
        [sessionRecord] = await db.insert(sessions).values({
          id: generatedSessionId,
          userId: user.id,
          sessionTokenHash,
          expiresAt,
          ip,
          userAgent,
        }).returning({
          id: sessions.id,
          expiresAt: sessions.expiresAt,
        });
        console.log('[createSession] Session created successfully after table creation:', sessionRecord);
      } catch (createError) {
        console.error('[createSession] Error creating sessions table:', createError);
        throw createError;
      }
    } else if (error instanceof Error && error.message.includes('null value in column "id" of relation "sessions"')) {
      console.log('[createSession] Null ID error detected, fixing default UUID generator...');
      // Defensive fix: ensure the id column has a default UUID generator
      try {
        await db.execute(`
          ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid()
        `);
        console.log('[createSession] Default UUID generator set, retrying insert with ID:', generatedSessionId);
        // Retry insert after setting default (and keep explicit id for certainty)
        [sessionRecord] = await db.insert(sessions).values({
          id: generatedSessionId,
          userId: user.id,
          sessionTokenHash,
          expiresAt,
          ip,
          userAgent,
        }).returning({
          id: sessions.id,
          expiresAt: sessions.expiresAt,
        });
        console.log('[createSession] Session created successfully after fixing default:', sessionRecord);
      } catch (alterError) {
        console.error('[createSession] Error setting default for sessions.id:', alterError);
        throw alterError;
      }
    } else {
      console.error('[createSession] Unexpected error:', error);
      throw error;
    }
  }
  
  const session: Session = {
    id: sessionRecord.id,
    userId: user.id,
    user,
    expiresAt: sessionRecord.expiresAt,
  };
  
  return { sessionToken, session };
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const sessionTokenHash = await hash(sessionToken);
    
    // Find active session
    const [sessionRecord] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          displayId: users.displayId,
          role: users.role,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.sessionTokenHash, sessionTokenHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!sessionRecord) {
      return null;
    }
    
    return {
      id: sessionRecord.id,
      userId: sessionRecord.userId,
      user: sessionRecord.user,
      expiresAt: sessionRecord.expiresAt,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Set session cookie in response
 */
export async function setSessionCookie(response: NextResponse, sessionToken: string, user: User): Promise<void> {
  console.log('[setSessionCookie] Setting session cookie for user:', user.id);
  console.log('[setSessionCookie] User data:', { id: user.id, email: user.email, role: user.role });
  
  // Create JWT token for middleware validation
  const jwtToken = await createMiddlewareSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Math.floor((Date.now() + SESSION_DURATION_MS) / 1000),
  });
  
  console.log('[setSessionCookie] JWT token created, setting cookie');
  
  response.cookies.set(SESSION_COOKIE_NAME, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // 30 days in seconds
  });
  
  console.log('[setSessionCookie] Cookie set successfully');
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });
}

/**
 * Destroy a session (logout)
 */
export async function destroySession(sessionId?: string): Promise<void> {
  try {
    if (sessionId) {
      // Destroy specific session
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    } else {
      // Destroy current session
      const session = await getSession();
      if (session) {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.id, session.id));
      }
    }
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}

/**
 * Destroy all sessions for a user
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.userId, userId));
  } catch (error) {
    console.error('Error destroying all user sessions:', error);
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(lt(sessions.expiresAt, new Date()));
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  kind: 'otp_request' | 'otp_verify' | 'login' | 'logout' | 'rate_limit' | 'otp_expired' | 'otp_denied',
  email?: string,
  userId?: string,
  ip?: string,
  userAgent?: string,
  meta?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(authAudit).values({
      kind,
      email,
      userId,
      ip,
      userAgent,
      metadata: meta,
    });
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
}

/**
 * Get current user from JWT session token (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    console.log('[getCurrentUser] Session token present:', !!sessionToken);
    console.log('[getCurrentUser] Session token length:', sessionToken?.length || 0);
    
    if (!sessionToken) {
      console.log('[getCurrentUser] No session token found');
      return null;
    }
    
    // Verify JWT token
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
    );
    
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    
    console.log('[getCurrentUser] JWT payload:', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
      expDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'no exp',
      currentTime: Math.floor(Date.now() / 1000),
      currentDate: new Date().toISOString()
    });
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('[getCurrentUser] Token expired');
      return null;
    }
    
    // Get user data from database to include displayId
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        displayId: users.displayId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId as string))
      .limit(1);

    if (!userRecord.length) {
      console.log('[getCurrentUser] No user found in database');
      return null;
    }

    const userData = userRecord[0];
    
    console.log('[getCurrentUser] User found in database:', userData);
    
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      displayId: userData.displayId || 'user-' + userData.id.substring(0, 8),
      role: userData.role,
    };
  } catch (error) {
    console.error('Error getting current user from JWT:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export async function hasRole(requiredRole: 'buyer' | 'seller' | 'support' | 'admin'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const roleHierarchy = {
    buyer: 1,
    seller: 2,
    support: 3,
    admin: 4,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require specific role middleware
 */
export async function requireRole(role: 'buyer' | 'seller' | 'support' | 'admin'): Promise<User> {
  const user = await requireAuth();
  
  const roleHierarchy = {
    buyer: 1,
    seller: 2,
    support: 3,
    admin: 4,
  };
  
  if (roleHierarchy[user.role] < roleHierarchy[role]) {
    throw new Error(`Role ${role} required`);
  }
  
  return user;
}
