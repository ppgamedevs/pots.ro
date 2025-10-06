import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/authz';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { seller_id, legal_name, cui, iban, phone, email, return_policy } = await req.json();
    await db.update(sellers)
      .set({ legalName: legal_name, cui, iban, phone, email, returnPolicy: return_policy })
      .where(eq(sellers.id, seller_id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update billing error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}


