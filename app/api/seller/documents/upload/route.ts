import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { sellers, sellerKycDocuments } from '@/db/schema/core';
import { eq, and, ne } from 'drizzle-orm';
import { randomBytes, createCipheriv } from 'crypto';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Valid document types
const VALID_DOC_TYPES = [
  'company_registration',
  'cui_certificate',
  'id_document',
  'iban_proof',
];

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY not configured');
  }
  // Ensure key is 32 bytes for AES-256
  return Buffer.from(key, 'hex').slice(0, 32);
}

// Encrypt document data
function encryptDocument(data: Buffer): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return { encrypted, iv, tag };
}

export async function POST(req: NextRequest) {
  try {
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
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Fișierul lipsește' }, { status: 400 });
    }

    if (!docType || !VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: 'Tip de document invalid' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fișierul este prea mare (max 10MB)' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tip de fișier invalid. Acceptăm doar PDF, JPG și PNG.' 
      }, { status: 400 });
    }

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

    // Read and encrypt file data
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { encrypted, iv, tag } = encryptDocument(fileBuffer);

    // Save document record
    const [document] = await db
      .insert(sellerKycDocuments)
      .values({
        sellerId: seller.id,
        docType: docType,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        encryptedData: encrypted,
        encryptionIv: iv,
        encryptionTag: tag,
        status: 'uploaded',
        uploadedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`[KYC Upload] Seller ${seller.id} uploaded ${docType}: ${document.id}`);

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
