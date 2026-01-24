import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerApiKeys } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { hash } from '@/lib/auth/crypto';

// GET: Get single API key details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const key = await db.query.developerApiKeys.findFirst({
      where: eq(developerApiKeys.id, params.id),
    });

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      key: {
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        status: key.status,
        lastUsedAt: key.lastUsedAt,
        lastUsedIp: key.lastUsedIp,
        expiresAt: key.expiresAt,
        createdBy: key.createdBy,
        createdAt: key.createdAt,
        revokedAt: key.revokedAt,
        revokedBy: key.revokedBy,
        revokedReason: key.revokedReason,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API key get error:', err);
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 });
  }
}

// PATCH: Update API key (name, scopes) or revoke
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const body = await req.json();
    const { action, name, scopes, reason } = body as {
      action?: 'update' | 'revoke';
      name?: string;
      scopes?: string[];
      reason?: string;
    };

    const key = await db.query.developerApiKeys.findFirst({
      where: eq(developerApiKeys.id, params.id),
    });

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (action === 'revoke') {
      if (key.status === 'revoked') {
        return NextResponse.json({ error: 'Key is already revoked' }, { status: 400 });
      }

      await db
        .update(developerApiKeys)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          revokedBy: user.id,
          revokedReason: reason || 'Manually revoked',
          updatedAt: new Date(),
        })
        .where(eq(developerApiKeys.id, params.id));

      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'api_key.revoke',
        entityType: 'developer_api_key',
        entityId: params.id,
        message: `Revoked API key "${key.name}" (${key.prefix})`,
        meta: { reason },
      });

      return NextResponse.json({ success: true, message: 'Key revoked' });
    }

    // Update name/scopes
    const updates: Partial<typeof developerApiKeys.$inferInsert> = { updatedAt: new Date() };
    if (name && typeof name === 'string' && name.trim().length >= 3) {
      updates.name = name.trim();
    }
    if (Array.isArray(scopes)) {
      updates.scopes = scopes;
    }

    const [updated] = await db
      .update(developerApiKeys)
      .set(updates)
      .where(eq(developerApiKeys.id, params.id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'api_key.update',
      entityType: 'developer_api_key',
      entityId: params.id,
      message: `Updated API key "${updated.name}" (${key.prefix})`,
      meta: { updates },
    });

    return NextResponse.json({ success: true, key: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API key update error:', err);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// DELETE: Hard delete (admin only, requires confirmation)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const key = await db.query.developerApiKeys.findFirst({
      where: eq(developerApiKeys.id, params.id),
    });

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await db.delete(developerApiKeys).where(eq(developerApiKeys.id, params.id));

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'api_key.delete',
      entityType: 'developer_api_key',
      entityId: params.id,
      message: `Deleted API key "${key.name}" (${key.prefix})`,
    });

    return NextResponse.json({ success: true, message: 'Key deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API key delete error:', err);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
