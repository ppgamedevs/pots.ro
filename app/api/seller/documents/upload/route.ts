import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { sellers, sellerKycDocuments } from '@/db/schema/core';
import { eq, and, ne } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { encryptKycDocument } from '@/lib/kyc/crypto';
import { validateKycUploadFile } from '@/lib/kyc/upload-validation';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

export const runtime = 'nodejs';

// Valid document types
const VALID_DOC_TYPES = [
  'company_registration',
  'cui_certificate',
  'id_document',
  'iban_proof',
];

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, 'seller_kyc_upload');
    if (!rl.allowed) return rl.response!;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller for this user
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, session.user.id))
      .limit(1);

    if (!seller) {
      return NextResponse.json({ error: 'Nu ai un cont de vânzător' }, { status: 404 });
    }

    if (seller.status !== 'onboarding') {
      return NextResponse.json({ error: 'Contul tău este deja activ sau suspendat' }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');
    const docType = formData.get('docType') as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fișierul lipsește' }, { status: 400 });
    }

    if (!docType || !VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: 'Tip de document invalid' }, { status: 400 });
    }

    // Validate and normalize upload (size + magic-byte sniffing + filename sanitization)
    const validatedOrResponse = await (async () => {
      try {
        return await validateKycUploadFile(file);
      } catch (e) {
        const code = e instanceof Error ? e.message : 'INVALID_UPLOAD';
        if (code === 'FILE_TOO_LARGE') {
          return NextResponse.json({ error: 'Fișierul este prea mare (max 10MB)' }, { status: 400 });
        }
        if (code === 'INVALID_FILE_TYPE' || code === 'DISALLOWED_BINARY') {
          return NextResponse.json(
            { error: 'Tip de fișier invalid. Acceptăm doar PDF, JPG și PNG.' },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: 'Fișier invalid' }, { status: 400 });
      }
    })();

    if (validatedOrResponse instanceof Response) {
      return validatedOrResponse;
    }

    const validated = validatedOrResponse;

    // Mark existing documents of this type as superseded
    await db
      .update(sellerKycDocuments)
      .set({ status: 'superseded', updatedAt: new Date() })
      .where(
        and(
          eq(sellerKycDocuments.sellerId, seller.id),
          eq(sellerKycDocuments.docType, docType),
          ne(sellerKycDocuments.status, 'superseded')
        )
      );

    const fileHash = createHash('sha256').update(validated.buffer).digest('hex');
    const encrypted = encryptKycDocument(validated.buffer);

    // Save document record
    const [document] = await db
      .insert(sellerKycDocuments)
      .values({
        sellerId: seller.id,
        docType: docType,
        filename: validated.safeFilename,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        encryptedData: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionTag: encrypted.tag,
        status: 'uploaded',
        uploadedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`[KYC Upload] Seller ${seller.id} uploaded ${docType}: ${document.id} sha256=${fileHash}`);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.docType,
        filename: document.filename,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea documentului' },
      { status: 500 }
    );
  }
}

// GET: List documents for the current seller
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, session.user.id))
      .limit(1);

    if (!seller) {
      return NextResponse.json({ error: 'Nu ai un cont de vânzător' }, { status: 404 });
    }

    const documents = await db
      .select({
        id: sellerKycDocuments.id,
        type: sellerKycDocuments.docType,
        filename: sellerKycDocuments.filename,
        status: sellerKycDocuments.status,
        createdAt: sellerKycDocuments.createdAt,
        reviewedAt: sellerKycDocuments.reviewedAt,
        reviewMessage: sellerKycDocuments.reviewMessage,
      })
      .from(sellerKycDocuments)
      .where(
        and(
          eq(sellerKycDocuments.sellerId, seller.id),
          ne(sellerKycDocuments.status, 'superseded')
        )
      )
      .orderBy(sellerKycDocuments.createdAt);

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Eroare la încărcarea documentelor' },
      { status: 500 }
    );
  }
}
