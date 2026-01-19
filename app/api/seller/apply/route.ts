import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerApplications } from '@/db/schema/core';
import { and, eq, gt } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send';

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function isValidCUI(cui?: string) {
  if (!cui) return true; // optional
  return /^[A-Za-z0-9]{2,15}$/.test(cui.trim());
}

function isValidIBAN(iban?: string) {
  if (!iban) return false; // required
  return /^[A-Z]{2}[0-9A-Z]{13,30}$/i.test(iban.replace(/\s+/g, ''));
}

export async function POST(req: NextRequest) {
  try {
    let company, cui, contact_name, email, phone, iban, categories, website, carrier, return_policy;
    const ctype = req.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      const body = await req.json();
      ({ company, cui, contact_name, email, phone, iban, categories, website, carrier, return_policy } = body || {});
    } else {
      const fd = await req.formData();
      company = String(fd.get('company') || '');
      cui = String(fd.get('cui') || '');
      contact_name = String(fd.get('contact') || fd.get('contact_name') || '');
      email = String(fd.get('email') || '');
      phone = String(fd.get('phone') || '');
      iban = String(fd.get('iban') || '');
      website = String(fd.get('website') || '');
      carrier = String(fd.get('carrier') || '');
      return_policy = String(fd.get('return_policy') || '');
      const cats = fd.getAll('categories');
      categories = cats && cats.length ? cats.map((c:any)=>String(c)) : undefined;
    }

    if (!company || !email || !isValidEmail(email) || !isValidCUI(cui) || !isValidIBAN(iban)) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    }

    // Rate limit: max 3 aplicații / oră / email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await db.select({ id: sellerApplications.id })
      .from(sellerApplications)
      .where(and(
        eq(sellerApplications.email, email),
        gt(sellerApplications.createdAt, oneHourAgo)
      ));
    if (recent.length >= 3) {
      return NextResponse.json({ error: 'Prea multe încercări. Încearcă peste 1 oră.' }, { status: 429 });
    }

    const inserted = await db.insert(sellerApplications).values({
      company,
      cui,
      contactName: contact_name,
      email,
      phone,
      iban,
      categories,
      website,
      carrier,
      returnPolicy: return_policy,
      status: 'received',
    }).returning();

    // Emails (best-effort)
    const subj = 'Am primit aplicația ta - FloristMarket';
    const html = `<p>Salut ${contact_name || company},</p><p>Am primit aplicația ta de vânzător. Echipa noastră o va analiza în curând.</p>`;
    await sendEmail({ to: email, subject: subj, html, text: 'Am primit aplicația ta.' });
    await sendEmail({ to: 'ops@floristmarket.ro', subject: `Aplicare nouă seller: ${company}`, html: `<pre>${JSON.stringify(inserted[0], null, 2)}</pre>` });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Apply seller error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}

