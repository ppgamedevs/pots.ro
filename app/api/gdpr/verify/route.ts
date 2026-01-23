import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { gdprDsrRequests } from '@/db/schema/core';
import { verifyDsarVerifyToken } from '@/lib/compliance/dsar';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get('token') || '').trim();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const payload = await verifyDsarVerifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    const requestId = payload.requestId;

    const [row] = await db
      .select({
        id: gdprDsrRequests.id,
        status: gdprDsrRequests.status,
        emailHash: gdprDsrRequests.emailHash,
        verifyExpiresAt: gdprDsrRequests.verifyExpiresAt,
        verifiedAt: gdprDsrRequests.verifiedAt,
      })
      .from(gdprDsrRequests)
      .where(eq(gdprDsrRequests.id, requestId))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (row.emailHash !== payload.emailHash) return NextResponse.json({ error: 'Token mismatch' }, { status: 400 });

    if (row.verifyExpiresAt && row.verifyExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification window expired' }, { status: 410 });
    }

    if (row.verifiedAt || row.status !== 'pending_verification') {
      return NextResponse.json({ ok: true, message: 'Already verified' });
    }

    await db
      .update(gdprDsrRequests)
      .set({
        status: 'open',
        verifiedAt: new Date(),
      })
      .where(eq(gdprDsrRequests.id, requestId));

    return NextResponse.json({ ok: true, message: 'Verified' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
