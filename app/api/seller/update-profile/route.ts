import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/authz';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { seller_id, brand_name, about, logo_url, banner_url } = await req.json();
    await db.update(sellers)
      .set({ brandName: brand_name, about, logoUrl: logo_url, bannerUrl: banner_url })
      .where(eq(sellers.id, seller_id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}


