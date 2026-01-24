import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerApiKeys } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { hash } from '@/lib/auth/crypto';

// Generate a new API key
function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  const prefix = `pk_${randomBytes.slice(0, 8)}`;
  const key = `${prefix}_${randomBytes}`;
  return { key, prefix };
}

// POST: Rotate API key - creates new secret, invalidates old one
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const existingKey = await db.query.developerApiKeys.findFirst({
      where: eq(developerApiKeys.id, params.id),
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (existingKey.status !== 'active') {
      return NextResponse.json({ error: 'Can only rotate active keys' }, { status: 400 });
    }

    // Generate new key
    const { key, prefix } = generateApiKey();
    const keyHash = await hash(key);

    // Update with new key hash and prefix
    const [updated] = await db
      .update(developerApiKeys)
      .set({
        prefix,
        keyHash,
        updatedAt: new Date(),
      })
      .where(eq(developerApiKeys.id, params.id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'api_key.rotate',
      entityType: 'developer_api_key',
      entityId: params.id,
      message: `Rotated API key "${existingKey.name}" from ${existingKey.prefix} to ${prefix}`,
      meta: { oldPrefix: existingKey.prefix, newPrefix: prefix },
    });

    return NextResponse.json({
      key: {
        id: updated.id,
        name: updated.name,
        prefix: updated.prefix,
        scopes: updated.scopes,
        status: updated.status,
        expiresAt: updated.expiresAt,
        createdAt: updated.createdAt,
      },
      // This is the ONLY time the new key is returned
      secretKey: key,
      warning: 'Save this key now. It will not be shown again. The old key is now invalid.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API key rotate error:', err);
    return NextResponse.json({ error: 'Failed to rotate API key' }, { status: 500 });
  }
}
