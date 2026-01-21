import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerActions, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUserId } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';
import { createImpersonationToken, IMPERSONATION_COOKIE_NAME, verifyImpersonationToken } from '@/lib/impersonation';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  message: z.string().min(10, 'Mesajul trebuie să aibă minimum 10 caractere'),
  ttlMinutes: z.number().int().min(5).max(120).optional(),
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
    const data = startSchema.parse(body);

    const ttlMinutes = data.ttlMinutes ?? 15;
    const ttlSeconds = ttlMinutes * 60;

    const token = await createImpersonationToken({ sellerId, adminUserId: userId, ttlSeconds });
    const decoded = await verifyImpersonationToken(token);

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'impersonate_start',
        message: data.message,
        meta: { ttlMinutes },
        adminUserId: userId,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    const res = NextResponse.json({
      ok: true,
      expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    });

    res.cookies.set(IMPERSONATION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ttlSeconds,
    });

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error starting impersonation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'impersonate_end',
        message: 'Admin ended impersonation',
        adminUserId: userId,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return res;
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
