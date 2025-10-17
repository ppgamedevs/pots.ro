import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { verifyMiddlewareSessionToken } from '@/lib/auth/middleware-session';

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-session] Starting session debug');
    
    // Get all cookies
    const allCookies = request.cookies.getAll();
    console.log('[debug-session] All cookies:', allCookies);
    
    // Check for session cookie specifically
    const sessionCookie = request.cookies.get('fm_session');
    console.log('[debug-session] Session cookie:', sessionCookie);
    
    // Try middleware session verification
    const middlewareSession = await verifyMiddlewareSessionToken(request);
    console.log('[debug-session] Middleware session:', middlewareSession);
    
    // Try getCurrentUser
    const currentUser = await getCurrentUser();
    console.log('[debug-session] Current user:', currentUser);
    
    // Check environment
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'present' : 'missing'
    };
    console.log('[debug-session] Environment:', envInfo);
    
    return NextResponse.json({
      success: true,
      debug: {
        allCookies,
        sessionCookie,
        middlewareSession,
        currentUser,
        envInfo,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[debug-session] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[debug-session] POST request - testing login');
    
    // Simulate login
    const { SignJWT } = await import('jose');
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
    );
    
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    const jwt = await new SignJWT({
      userId: 'debug-user-id',
      email: 'debug@example.com',
      role: 'buyer',
      exp: expiresAt
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);
    
    console.log('[debug-session] JWT created:', jwt.substring(0, 50) + '...');
    
    const response = NextResponse.json({
      success: true,
      message: 'Debug session created',
      jwtLength: jwt.length,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });
    
    // Set cookie
    response.cookies.set('fm_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });
    
    console.log('[debug-session] Cookie set in response');
    
    return response;
    
  } catch (error) {
    console.error('[debug-session] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
