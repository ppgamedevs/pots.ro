import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    console.log('[session-test] Testing session reading');
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'No session found',
        hasSession: false
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session found',
      hasSession: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayId: user.displayId
      }
    });
    
  } catch (error) {
    console.error('[session-test] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Session test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
