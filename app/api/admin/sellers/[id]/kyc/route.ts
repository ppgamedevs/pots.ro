import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerKycDocuments, sellers } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

function isAdminOrSupport(role?: string | null) {
  return role === 'admin' || role === 'support';
}

const updateSchema = z.object({
  action: z.enum(['set_flags', 'request_reverification']),
  message: z.string().min(10).max(500),
  flags: z
    .object({
      verifiedBadge: z.boolean().optional(),
      cuiValidated: z.boolean().optional(),
      ibanValidated: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdminOrSupport(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [seller] = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
        cui: sellers.cui,
        iban: sellers.iban,
        verifiedBadge: sellers.verifiedBadge,
        cuiValidatedAt: sellers.cuiValidatedAt,
        ibanValidatedAt: sellers.ibanValidatedAt,
        kycReverificationRequestedAt: sellers.kycReverificationRequestedAt,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const docs = await db
      .select({
        id: sellerKycDocuments.id,
        docType: sellerKycDocuments.docType,
        filename: sellerKycDocuments.filename,
        mimeType: sellerKycDocuments.mimeType,
        sizeBytes: sellerKycDocuments.sizeBytes,
        status: sellerKycDocuments.status,
        createdAt: sellerKycDocuments.createdAt,
        reviewedAt: sellerKycDocuments.reviewedAt,
        reviewMessage: sellerKycDocuments.reviewMessage,
        uploadedBy: sellerKycDocuments.uploadedBy,
        reviewedBy: sellerKycDocuments.reviewedBy,
      })
      .from(sellerKycDocuments)
      .where(eq(sellerKycDocuments.sellerId, sellerId))
      .orderBy(desc(sellerKycDocuments.createdAt))
      .limit(50);

    return NextResponse.json({
      seller,
      verification: {
        cuiValidated: !!seller.cuiValidatedAt,
        ibanValidated: !!seller.ibanValidatedAt,
        verifiedBadge: !!seller.verifiedBadge,
        reverifyRequested: !!seller.kycReverificationRequestedAt,
      },
      documents: docs,
    });
  } catch (error) {
    console.error('Error fetching seller KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    if (data.action === 'request_reverification') {
      await db
        .update(sellers)
        .set({
          verifiedBadge: false,
          cuiValidatedAt: null,
          ibanValidatedAt: null,
          kycReverificationRequestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sellers.id, sellerId));

      try {
        await db.insert(sellerActions).values({
          sellerId,
          action: 'kyc_request_reverification',
          message: data.message,
          meta: {},
          adminUserId: user.id,
        });
      } catch (err) {
        console.error('Could not write seller action audit:', err);
      }

      return NextResponse.json({ ok: true });
    }

    const flags = data.flags || {};
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (typeof flags.verifiedBadge === 'boolean') updates.verifiedBadge = flags.verifiedBadge;
    if (typeof flags.cuiValidated === 'boolean') updates.cuiValidatedAt = flags.cuiValidated ? new Date() : null;
    if (typeof flags.ibanValidated === 'boolean') updates.ibanValidatedAt = flags.ibanValidated ? new Date() : null;

    await db.update(sellers).set(updates).where(eq(sellers.id, sellerId));

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'kyc_set_flags',
        message: data.message,
        meta: { flags },
        adminUserId: user.id,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error updating seller KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
