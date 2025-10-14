import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users, authAudit } from '@/db/schema';
import { eq, and, gt, isNull, lt } from 'drizzle-orm';
import { hash, generateSessionToken, getClientIP, getUserAgent } from './crypto';

// Session configuration
const SESSION_COOKIE_NAME = 'fm_session';
const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'buyer' | 'seller' | 'admin';
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
  try {
    // Prefer explicitly providing an id to avoid DB default issues
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
  } catch (error) {
    // Auto-create sessions table if it doesn't exist, then retry once
    if (error instanceof Error && error.message.includes('relation "sessions" does not exist')) {
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
        // Retry insert
        [sessionRecord] = await db.insert(sessions).values({
          userId: user.id,
          sessionTokenHash,
          expiresAt,
          ip,
          userAgent,
        }).returning({
          id: sessions.id,
          expiresAt: sessions.expiresAt,
        });
      } catch (createError) {
        console.error('Error creating sessions table:', createError);
        throw createError;
      }
    } else if (error instanceof Error && error.message.includes('null value in column "id" of relation "sessions"')) {
      // Defensive fix: ensure the id column has a default UUID generator
      try {
        await db.execute(`
          ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid()
        `);
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
      } catch (alterError) {
        console.error('Error setting default for sessions.id:', alterError);
        throw alterError;
      }
    } else {
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
export function setSessionCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // 30 days in seconds
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
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
      meta,
    });
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if user has required role
 */
export async function hasRole(requiredRole: 'buyer' | 'seller' | 'admin'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const roleHierarchy = {
    buyer: 1,
    seller: 2,
    admin: 3,
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
export async function requireRole(role: 'buyer' | 'seller' | 'admin'): Promise<User> {
  const user = await requireAuth();
  
  const roleHierarchy = {
    buyer: 1,
    seller: 2,
    admin: 3,
  };
  
  if (roleHierarchy[user.role] < roleHierarchy[role]) {
    throw new Error(`Role ${role} required`);
  }
  
  return user;
}
