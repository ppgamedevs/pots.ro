import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { sellerKycDocuments, sellerActions, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
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

    const { id: sellerId, documentId } = await params;
    const body = await req.json();
    const { action, reason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get the document
    const [doc] = await db
      .select()
      .from(sellerKycDocuments)
      .where(eq(sellerKycDocuments.id, documentId))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Document does not belong to this seller' }, { status: 400 });
    }

    if (doc.status !== 'uploaded') {
      return NextResponse.json({ error: 'Document has already been reviewed' }, { status: 400 });
    }

    // Update document status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await db
      .update(sellerKycDocuments)
      .set({
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewMessage: action === 'reject' ? reason : null,
        updatedAt: new Date(),
      })
      .where(eq(sellerKycDocuments.id, documentId));

    // Log the action
    await db.insert(sellerActions).values({
      sellerId,
      adminId: session.user.id,
      action: action === 'approve' ? 'document_approved' : 'document_rejected',
      message: action === 'approve' 
        ? `Document "${doc.filename}" (${doc.docType}) aprobat`
        : `Document "${doc.filename}" (${doc.docType}) respins: ${reason}`,
      meta: {
        documentId: doc.id,
        documentType: doc.docType,
        filename: doc.filename,
      },
      createdAt: new Date(),
    });

    console.log(`[KYC Review] Admin ${session.user.id} ${action}d document ${documentId} for seller ${sellerId}`);

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        status: newStatus,
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Document review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
