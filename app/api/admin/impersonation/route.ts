import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth-helpers';
import { getImpersonationFromCookies } from '@/lib/impersonation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const imp = await getImpersonationFromCookies();
    if (!imp || imp.adminUserId !== userId) return NextResponse.json({ active: false });

    const [seller] = await db
      .select({ id: sellers.id, slug: sellers.slug, brandName: sellers.brandName })
      .from(sellers)
      .where(eq(sellers.id, imp.sellerId))
      .limit(1);

    return NextResponse.json({
      active: true,
      seller: seller || { id: imp.sellerId },
      expiresAt: imp.exp ? new Date(imp.exp * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Error getting impersonation status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
