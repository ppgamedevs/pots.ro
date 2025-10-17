import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const SESSION_COOKIE_NAME = 'fm_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
);

export interface MiddlewareSession extends JWTPayload {
  userId: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  expiresAt: number;
}

/**
 * Create a JWT session token for middleware validation
 */
export async function createMiddlewareSessionToken(sessionData: MiddlewareSession): Promise<string> {
  console.log('[createMiddlewareSessionToken] Creating JWT token for user:', sessionData.userId);
  console.log('[createMiddlewareSessionToken] Session data:', { 
    userId: sessionData.userId, 
    email: sessionData.email, 
    role: sessionData.role,
    expiresAt: new Date(sessionData.expiresAt * 1000).toISOString()
  });
  
  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
    
  console.log('[createMiddlewareSessionToken] JWT token created, length:', token.length);
  return token;
}

/**
 * Verify JWT session token in middleware
 */
export async function verifyMiddlewareSessionToken(request: NextRequest): Promise<MiddlewareSession | null> {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    console.log('[verifyMiddlewareSessionToken] Checking session token:', sessionToken ? 'present' : 'missing');
    
    if (!sessionToken) {
      console.log('[verifyMiddlewareSessionToken] No session token found');
      return null;
    }
    
    console.log('[verifyMiddlewareSessionToken] Verifying JWT token, length:', sessionToken.length);
    
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    
    console.log('[verifyMiddlewareSessionToken] JWT payload:', {
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
      console.log('[verifyMiddlewareSessionToken] Token expired');
      return null;
    }
    
    const session = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'buyer' | 'seller' | 'admin',
      expiresAt: payload.exp as number,
    };
    
    console.log('[verifyMiddlewareSessionToken] Session validated successfully:', session);
    return session;
  } catch (error) {
    console.error('[verifyMiddlewareSessionToken] Error verifying middleware session token:', error);
    return null;
  }
}
