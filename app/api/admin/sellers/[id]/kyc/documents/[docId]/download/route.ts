import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerKycDocuments } from '@/db/schema/core';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';
import { decryptKycDocument } from '@/lib/kyc/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string; docId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [doc] = await db
      .select({
        filename: sellerKycDocuments.filename,
        mimeType: sellerKycDocuments.mimeType,
        encryptedData: sellerKycDocuments.encryptedData,
        encryptionIv: sellerKycDocuments.encryptionIv,
        encryptionTag: sellerKycDocuments.encryptionTag,
      })
      .from(sellerKycDocuments)
      .where(and(eq(sellerKycDocuments.id, params.docId), eq(sellerKycDocuments.sellerId, sellerId)))
      .limit(1);

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ciphertext = Buffer.isBuffer(doc.encryptedData) ? doc.encryptedData : Buffer.from(doc.encryptedData as any);
    const iv = Buffer.isBuffer(doc.encryptionIv) ? doc.encryptionIv : Buffer.from(doc.encryptionIv as any);
    const tag = Buffer.isBuffer(doc.encryptionTag) ? doc.encryptionTag : Buffer.from(doc.encryptionTag as any);

    const plain = decryptKycDocument({
      ciphertext,
      iv,
      tag,
    });

    const filename = doc.filename || 'document';
    const encodedFilename = encodeURIComponent(filename);

    const body = new Uint8Array(plain);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error downloading KYC document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
