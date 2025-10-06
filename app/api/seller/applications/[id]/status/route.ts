import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerApplications, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { sendEmail } from '@/lib/email/send';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(req, ['admin']);
    const id = params.id;
    const { status, notes } = await req.json();

    const [app] = await db.update(sellerApplications)
      .set({ status, notes })
      .where(eq(sellerApplications.id, id))
      .returning();

    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (status === 'approved') {
      // create seller row in onboarding
      const brand = app.company;
      await db.insert(sellers).values({
        userId: app.id, // NOTE: if not linked to a user yet, leave placeholder; replace when auth is wired
        slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brandName: brand,
        cui: app.cui || null,
        iban: app.iban || null,
        email: app.email,
        phone: app.phone || null,
        status: 'onboarding',
      }).onConflictDoNothing();
    }

    const subj = status === 'need_info' ? 'Avem nevoie de informații suplimentare' : status === 'approved' ? 'Cont aprobat - începe onboarding-ul' : `Status aplicație: ${status}`;
    const html = `<p>Salut ${app.contactName || app.company},</p><p>Status aplicație: <strong>${status}</strong></p>${notes ? `<p>Note: ${notes}</p>` : ''}`;
    await sendEmail({ to: app.email, subject: subj, html });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update application status error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


