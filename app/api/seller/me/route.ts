import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole, getUser } from '@/lib/authz';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await db.select().from(sellers).where(eq(sellers.userId, user.id));
    const seller = items[0] || null;
    if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ seller });
  } catch (error) {
    console.error('Seller me error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}


