import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerActions, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUserId } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

const schema = z.object({
  message: z.string().min(10, 'Mesajul trebuie să aibă minimum 10 caractere'),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = schema.parse(body);

    const [updated] = await db
      .update(sellers)
      .set({ status: 'onboarding' as any, updatedAt: new Date() })
      .where(eq(sellers.id, sellerId))
      .returning({ id: sellers.id, status: sellers.status, slug: sellers.slug });

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'reset_onboarding',
        message: data.message,
        meta: { to: 'onboarding' },
        adminUserId: userId,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true, seller: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error resetting onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
