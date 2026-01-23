import { NextResponse } from 'next/server';
import { listFlags } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flags = await listFlags();
    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json({ flags: [] });
  }
}
