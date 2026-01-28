/**
 * API: Admin get seller onboarding progress
 * 
 * GET /api/admin/sellers/[id]/onboarding
 * Returns detailed onboarding progress for admin/support view
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { getSellerOnboardingProgress } from '@/lib/seller/onboarding-progress';
import { db } from '@/db';
import { sellerKycDocuments, users } from '@/db/schema/core';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, ['admin', 'support']);
    const { id: sellerId } = await params;

    const progress = await getSellerOnboardingProgress(sellerId);

    if (!progress) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get full document list with reviewer info for admin
    interface DocResult {
      id: string;
      docType: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      status: 'uploaded' | 'approved' | 'rejected' | 'superseded';
      reviewMessage: string | null;
      reviewedAt: Date | null;
      createdAt: Date | null;
      reviewerEmail: string | null;
      reviewerName: string | null;
    }
    
    const documents: DocResult[] = await db
      .select({
        id: sellerKycDocuments.id,
        docType: sellerKycDocuments.docType,
        filename: sellerKycDocuments.filename,
        mimeType: sellerKycDocuments.mimeType,
        sizeBytes: sellerKycDocuments.sizeBytes,
        status: sellerKycDocuments.status,
        reviewMessage: sellerKycDocuments.reviewMessage,
        reviewedAt: sellerKycDocuments.reviewedAt,
        createdAt: sellerKycDocuments.createdAt,
        reviewerEmail: users.email,
        reviewerName: users.name,
      })
      .from(sellerKycDocuments)
      .leftJoin(users, eq(sellerKycDocuments.reviewedBy, users.id))
      .where(eq(sellerKycDocuments.sellerId, sellerId))
      .orderBy(desc(sellerKycDocuments.createdAt));

    return NextResponse.json({
      progress,
      documents: documents.map((d) => ({
        ...d,
        createdAt: d.createdAt?.toISOString(),
        reviewedAt: d.reviewedAt?.toISOString(),
      })),
      // Show full PII for admin, masked for support
      showFullPii: user.role === 'admin',
    });
  } catch (error) {
    console.error('GET /api/admin/sellers/[id]/onboarding error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
