import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// Tipuri de fișiere permise
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
];

// Dimensiuni maxime (10MB pentru imagini)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Funcție pentru normalizarea numelui fișierului
function normalizeFilename(originalName: string): string {
  // Extrage extensia
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Generează UUID pentru partea principală
  const uuid = crypto.randomUUID();
  
  // Creează nume sigur
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${uuid}-${safeName}`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validare tip fișier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          allowedTypes: ALLOWED_TYPES 
        },
        { status: 400 }
      );
    }

    // Validare dimensiune
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large',
          maxSize: MAX_FILE_SIZE,
          currentSize: file.size
        },
        { status: 400 }
      );
    }

    // Normalizează numele fișierului
    const filename = normalizeFilename(file.name);
    
    // Upload la Vercel Blob
    const { url } = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Endpoint pentru upload multiple
export async function PUT(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadPromises = files.map(async (file) => {
      // Validare pentru fiecare fișier
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}`);
      }
      
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${file.name}`);
      }

      const filename = normalizeFilename(file.name);
      const { url } = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      });

      return {
        originalName: file.name,
        filename,
        url,
        size: file.size,
        type: file.type
      };
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      files: results
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
