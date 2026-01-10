import { NextRequest, NextResponse } from 'next/server';
import { captureException } from '@/lib/sentry';

/**
 * Test API route for Sentry error tracking
 * GET /api/test-sentry
 * This will trigger a server-side error that should be captured by Sentry
 */
export async function GET(request: NextRequest) {
  try {
    // Intentionally throw an error to test Sentry
    throw new Error('Test error from Sentry test API route - Server side');
  } catch (error) {
    // Capture the error to Sentry
    captureException(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/test-sentry',
      method: 'GET',
    });

    return NextResponse.json(
      { 
        error: 'Test error triggered',
        message: 'This error should appear in your Sentry dashboard',
        sentry: 'Error captured to Sentry',
      },
      { status: 500 }
    );
  }
}
