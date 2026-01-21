import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerApplications } from '@/db/schema/core';
import { and, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'support']);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any | null;
    const items = await db.select().from(sellerApplications).where(status ? eq(sellerApplications.status, status) : undefined);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('List applications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


