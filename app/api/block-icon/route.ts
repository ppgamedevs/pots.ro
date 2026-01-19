import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for fastest response
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  // Return 404 immediately with long cache to prevent repeated requests
  // Use empty string body instead of null for better compatibility with browser extensions
  return new NextResponse('', {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable, must-revalidate, stale-while-revalidate=86400',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
    },
  });
}
