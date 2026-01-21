import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerKycDocuments } from '@/db/schema/core';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';
import { encryptKycDocument } from '@/lib/kyc/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 10 * 1024 * 1024; // 10MB

const metaSchema = z.object({
  docType: z.string().min(2).max(80),
  message: z.string().min(10).max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file');
    const docType = form.get('docType');
    const message = form.get('message');

    const parsed = metaSchema.parse({
      docType: typeof docType === 'string' ? docType : '',
      message: typeof message === 'string' ? message : undefined,
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const encrypted = encryptKycDocument(buf);

    const [created] = await db
      .insert(sellerKycDocuments)
      .values({
        sellerId,
        docType: parsed.docType,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        encryptedData: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionTag: encrypted.tag,
        status: 'uploaded',
        uploadedBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: sellerKycDocuments.id,
        docType: sellerKycDocuments.docType,
        filename: sellerKycDocuments.filename,
        status: sellerKycDocuments.status,
        createdAt: sellerKycDocuments.createdAt,
      });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'kyc_doc_upload',
        message: parsed.message?.trim() || `Uploaded ${parsed.docType}: ${file.name}`,
        meta: { docType: parsed.docType, filename: file.name, mimeType: file.type, sizeBytes: file.size },
        adminUserId: user.id,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true, document: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error uploading KYC document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
