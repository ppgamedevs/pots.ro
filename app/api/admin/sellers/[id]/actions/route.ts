import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerActions, users } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

    const items = await db
      .select({
        id: sellerActions.id,
        action: sellerActions.action,
        message: sellerActions.message,
        meta: sellerActions.meta,
        createdAt: sellerActions.createdAt,
        admin: { id: users.id, email: users.email, name: users.name, role: users.role },
      })
      .from(sellerActions)
      .leftJoin(users, eq(users.id, sellerActions.adminUserId))
      .where(eq(sellerActions.sellerId, sellerId))
      .orderBy(desc(sellerActions.createdAt))
      .limit(limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching seller actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
