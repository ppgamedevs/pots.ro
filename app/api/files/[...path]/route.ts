import { getDownloadUrl, head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// Tipuri de fișiere private permise
const PRIVATE_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/zip'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // TODO: Implementează autentificarea și autorizarea aici
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Verifică permisiunile pentru fișierul specific
    // const hasAccess = await checkFileAccess(session.user.id, filePath);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const filePath = params.path.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path required' },
        { status: 400 }
      );
    }

    // Verifică dacă fișierul există și obține URL-ul semnat
    const url = await getDownloadUrl(filePath);

    // Obține metadatele fișierului
    const metadata = await head(filePath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Verifică tipul de fișier
    if (metadata.contentType && !PRIVATE_FILE_TYPES.includes(metadata.contentType)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 403 }
      );
    }

    // Redirect către URL-ul semnat (expiră automat)
    return NextResponse.redirect(url, 302);

  } catch (error) {
    console.error('Private file access error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to access file' },
      { status: 500 }
    );
  }
}

// Endpoint pentru obținerea metadatelor fișierului fără download
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    if (!filePath) {
      return new NextResponse(null, { status: 400 });
    }

    // TODO: Implementează autentificarea și autorizarea aici
    
    const metadata = await head(filePath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': metadata.size?.toString() || '0',
        'Cache-Control': 'private, max-age=300', // 5 minute cache pentru metadate
      },
    });

  } catch (error) {
    console.error('Private file metadata error:', error);
    return new NextResponse(null, { status: 404 });
  }
}
