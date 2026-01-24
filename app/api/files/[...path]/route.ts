import { getDownloadUrl, head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { getClientIP, getUserAgent } from '@/lib/auth/crypto';

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
    const filePath = params.path.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path required' },
        { status: 400 }
      );
    }

    // Basic path hardening
    if (filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Backups are strictly admin-only.
    const isBackup = filePath.startsWith('backups/');
    let actor: { id: string; role: string } | null = null;
    if (isBackup) {
      try {
        const user = await requireRole(request, ['admin']);
        actor = { id: user.id, role: user.role };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unauthorized';
        const status = message === 'Forbidden' ? 403 : 401;
        return NextResponse.json({ error: message }, { status });
      }
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Blob token not configured' },
        { status: 500 }
      );
    }

    // Verifică dacă fișierul există și obține URL-ul semnat
    const url = await getDownloadUrl(filePath, { token });

    // Obține metadatele fișierului
    const metadata = await head(filePath, { token });

    // Verifică tipul de fișier
    if (metadata.contentType && !PRIVATE_FILE_TYPES.includes(metadata.contentType)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 403 }
      );
    }

    if (isBackup && actor) {
      await writeAdminAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'ops.backup.download',
        entityType: 'backup',
        entityId: filePath,
        message: `Downloaded backup artifact: ${filePath}`,
        meta: {
          ip: getClientIP(request.headers),
          ua: getUserAgent(request.headers),
          contentType: metadata.contentType ?? null,
          size: metadata.size ?? null,
        },
      });
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

    if (filePath.includes('..')) {
      return new NextResponse(null, { status: 400 });
    }

    const isBackup = filePath.startsWith('backups/');
    if (isBackup) {
      try {
        await requireRole(request, ['admin']);
      } catch {
        return new NextResponse(null, { status: 401 });
      }
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new NextResponse(null, { status: 500 });
    }

    const metadata = await head(filePath, { token });

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
