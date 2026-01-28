/**
 * API: Get seller onboarding progress
 * 
 * GET /api/seller/onboarding/progress
 * Returns the current user's seller onboarding progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getSellerOnboardingProgressByUserId } from '@/lib/seller/onboarding-progress';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getSellerOnboardingProgressByUserId(user.id);

    if (!progress) {
      return NextResponse.json({
        error: 'no_seller',
        message: 'Nu ai un cont de vânzător activ. Trimite o aplicație pentru a deveni vânzător.',
      }, { status: 404 });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('GET /api/seller/onboarding/progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
