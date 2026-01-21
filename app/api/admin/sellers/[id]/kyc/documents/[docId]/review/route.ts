import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerKycDocuments } from '@/db/schema/core';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['approved', 'rejected']),
  message: z.string().min(3).max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string; docId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = schema.parse(body);

    const [updated] = await db
      .update(sellerKycDocuments)
      .set({
        status: data.status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewMessage: data.message?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(sellerKycDocuments.id, params.docId), eq(sellerKycDocuments.sellerId, sellerId)))
      .returning({
        id: sellerKycDocuments.id,
        status: sellerKycDocuments.status,
        reviewedAt: sellerKycDocuments.reviewedAt,
      });

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: data.status === 'approved' ? 'kyc_doc_approve' : 'kyc_doc_reject',
        message: data.message?.trim() || `Document ${data.status}`,
        meta: { documentId: params.docId },
        adminUserId: user.id,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true, document: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error reviewing KYC document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
