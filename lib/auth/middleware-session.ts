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
  return await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

/**
 * Verify JWT session token in middleware
 */
export async function verifyMiddlewareSessionToken(request: NextRequest): Promise<MiddlewareSession | null> {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'buyer' | 'seller' | 'admin',
      expiresAt: payload.exp as number,
    };
  } catch (error) {
    console.error('Error verifying middleware session token:', error);
    return null;
  }
}
