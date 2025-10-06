import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/authz';
import { sendEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { seller_id } = await req.json();
    const [s] = await db.select().from(sellers).where(eq(sellers.id, seller_id));
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!s.brandName || !s.logoUrl || !s.iban || !s.returnPolicy) {
      return NextResponse.json({ error: 'Incomplete profile' }, { status: 400 });
    }
    await db.update(sellers).set({ status: 'active' }).where(eq(sellers.id, seller_id));
    await sendEmail({ to: s.email || '', subject: 'Onboarding complet', html: '<p>Ești live pe FloristMarket!</p>' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Finish onboarding error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}


