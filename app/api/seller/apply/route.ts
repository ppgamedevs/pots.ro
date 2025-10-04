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
