import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { sellers, sellerKycDocuments, sellerActions, users } from '@/db/schema/core';
import { eq, and, ne } from 'drizzle-orm';

const REQUIRED_DOCUMENT_TYPES = [
  'company_registration',
  'cui_certificate', 
  'id_document',
  'iban_proof',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin or support role
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser || !['admin', 'support'].includes(currentUser.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: sellerId } = await params;

    // Get seller - could be by ID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sellerId);
    
    let seller;
    if (isUuid) {
      [seller] = await db.select().from(sellers).where(eq(sellers.id, sellerId)).limit(1);
    } else {
      [seller] = await db.select().from(sellers).where(eq(sellers.slug, sellerId)).limit(1);
    }

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.status !== 'onboarding') {
      return NextResponse.json({ error: 'Seller is not in onboarding status' }, { status: 400 });
    }

    // Check all required documents are approved
    interface KycDoc {
      id: string;
      sellerId: string;
      docType: string;
      filename: string;
      status: 'uploaded' | 'approved' | 'rejected' | 'superseded';
      // other fields...
    }
    
    const documents = await db
      .select()
      .from(sellerKycDocuments)
      .where(
        and(
          eq(sellerKycDocuments.sellerId, seller.id),
          ne(sellerKycDocuments.status, 'superseded')
        )
      ) as KycDoc[];

    const approvedDocs = documents.filter((d: KycDoc) => d.status === 'approved');
    const approvedTypes = new Set(approvedDocs.map((d: KycDoc) => d.docType));

    const missingDocs = REQUIRED_DOCUMENT_TYPES.filter(type => !approvedTypes.has(type));
    
    if (missingDocs.length > 0) {
      return NextResponse.json({ 
        error: 'Nu toate documentele sunt aprobate',
        missingDocuments: missingDocs,
      }, { status: 400 });
    }

    // Activate seller
    await db
      .update(sellers)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, seller.id));

    // Log the action
    await db.insert(sellerActions).values({
      sellerId: seller.id,
      adminId: session.user.id,
      action: 'seller_activated',
      message: 'Seller activat după finalizarea onboarding-ului',
      meta: {
        approvedDocuments: approvedDocs.map((d: KycDoc) => ({
          id: d.id,
          type: d.docType,
          filename: d.filename,
        })),
      },
      createdAt: new Date(),
    });

    console.log(`[Seller Activation] Admin ${session.user.id} activated seller ${seller.id}`);

    // TODO: Send activation email to seller

    return NextResponse.json({
      success: true,
      seller: {
        id: seller.id,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Seller activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
