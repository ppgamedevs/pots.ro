import { NextRequest, NextResponse } from 'next/server';
import { 
  destroySession, 
  clearSessionCookie, 
  getCurrentUser,
  logAuthEvent 
} from '@/lib/auth/session';
import { getClientIP, getUserAgent } from '@/lib/auth/crypto';

/**
 * POST /api/auth/logout
 * Logout user and destroy session
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const ip = getClientIP(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    // Destroy current session
    await destroySession();
    
    // Log logout event
    if (user) {
      await logAuthEvent('logout', user.email, user.id, ip, userAgent);
    }
    
    // Create response
    const response = NextResponse.json({ ok: true });
    
    // Clear session cookie
    clearSessionCookie(response);
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Eroare la logout' },
      { status: 500 }
    );
  }
}