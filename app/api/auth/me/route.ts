import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
