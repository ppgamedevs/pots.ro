import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, setSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      const response = NextResponse.json({ user: null });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayId: user.displayId,
        role: user.role,
      }
    });

    // If the role changed since the token was issued (e.g. user promoted to admin/seller),
    // refresh the JWT cookie so edge middleware role-gating reflects the latest DB role.
    try {
      const sessionToken = request.cookies.get('fm_session')?.value;
      if (sessionToken) {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = new TextEncoder().encode(
          process.env.JWT_SECRET || 'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
        );
        const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
        const tokenRole = payload.role as string | undefined;

        if (tokenRole && tokenRole !== user.role) {
          await setSessionCookie(response, sessionToken, user);
        }
      }
    } catch {
      // Ignore refresh errors; response still returns the current user.
    }
    
    // Prevent caching of user data
    response.headers.set('Cache-Control', 'no-store');
    
    return response;
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
