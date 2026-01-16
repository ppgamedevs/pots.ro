import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for fastest response
export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse('', {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable, must-revalidate, stale-while-revalidate=86400',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Expires': new Date(Date.now() + 31536000000).toUTCString(),
    },
  });
}
