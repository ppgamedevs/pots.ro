import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { authOtp } from '@/db/schema/core';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Get latest OTP records
    const records = await db
      .select({
        email: authOtp.email,
        expiresAt: authOtp.expiresAt,
        consumedAt: authOtp.consumedAt,
        attempts: authOtp.attempts,
        createdAt: authOtp.createdAt,
      })
      .from(authOtp)
      .orderBy(desc(authOtp.createdAt))
      .limit(10);

    return NextResponse.json({
      records: records.map((r: any) => ({
        ...r,
        isExpired: r.expiresAt < new Date(),
        isConsumed: !!r.consumedAt,
      }))
    });
  } catch (error) {
    console.error('Debug OTP error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

