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
  if (!iban) return true; // optional
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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema pentru validarea formularului
const sellerApplicationSchema = z.object({
  company: z.string().min(1, 'Denumirea firmei este obligatorie'),
  cui: z.string().min(1, 'CUI/CIF este obligatoriu'),
  contact: z.string().min(1, 'Persoana de contact este obligatorie'),
  phone: z.string().optional(),
  email: z.string().email('Email invalid'),
  iban: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  categories: z.array(z.string()).optional(),
  carrier: z.string().optional(),
  return_policy: z.string().optional(),
  agree: z.literal('on')
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Convert FormData to object
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key === 'categories') {
        if (!data[key]) data[key] = [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // Validate data
    const validatedData = sellerApplicationSchema.parse(data);
    
    // TODO: Save to database
    // await db.insert(sellerApplications).values({
    //   ...validatedData,
    //   createdAt: new Date(),
    //   status: 'pending'
    // });
    
    // Log for now (MVP)
    console.log('Seller application received:', {
      company: validatedData.company,
      cui: validatedData.cui,
      contact: validatedData.contact,
      email: validatedData.email,
      categories: validatedData.categories,
      carrier: validatedData.carrier,
      returnPolicy: validatedData.return_policy,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Send email notification to admin
    // await sendEmail({
    //   to: 'admin@floristmarket.ro',
    //   subject: 'Nouă aplicație vânzător',
    //   template: 'seller-application',
    //   data: validatedData
    // });
    
    // Redirect to thank you page
    return NextResponse.redirect(new URL('/seller/thanks', request.url));
    
  } catch (error) {
    console.error('Error processing seller application:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Date invalide', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Eroare internă' },
      { status: 500 }
    );
  }
}
