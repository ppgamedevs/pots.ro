import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerApiKeys, users } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { desc, eq, and, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { hash } from '@/lib/auth/crypto';

// Available scopes for API keys
const AVAILABLE_SCOPES = [
  'products:read',
  'products:write',
  'orders:read',
  'orders:write',
  'sellers:read',
  'sellers:write',
  'analytics:read',
  'webhooks:read',
  'webhooks:write',
];

// Generate a secure API key with prefix
function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  const prefix = `pk_${randomBytes.slice(0, 8)}`;
  const key = `${prefix}_${randomBytes}`;
  return { key, prefix };
}

// GET: List API keys (without revealing secrets)
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(developerApiKeys.status, status as 'active' | 'revoked' | 'expired'));
    }

    type KeyRow = {
      id: string;
      name: string;
      prefix: string;
      scopes: string[];
      status: string;
      lastUsedAt: Date | null;
      lastUsedIp: string | null;
      expiresAt: Date | null;
      createdBy: string;
      createdAt: Date;
      revokedAt: Date | null;
      revokedReason: string | null;
      creatorEmail: string | null;
    };

    const keys: KeyRow[] = await db
      .select({
        id: developerApiKeys.id,
        name: developerApiKeys.name,
        prefix: developerApiKeys.prefix,
        scopes: developerApiKeys.scopes,
        status: developerApiKeys.status,
        lastUsedAt: developerApiKeys.lastUsedAt,
        lastUsedIp: developerApiKeys.lastUsedIp,
        expiresAt: developerApiKeys.expiresAt,
        createdBy: developerApiKeys.createdBy,
        createdAt: developerApiKeys.createdAt,
        revokedAt: developerApiKeys.revokedAt,
        revokedReason: developerApiKeys.revokedReason,
        creatorEmail: users.email,
      })
      .from(developerApiKeys)
      .leftJoin(users, eq(developerApiKeys.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(developerApiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(developerApiKeys)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      keys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        scopes: k.scopes,
        status: k.status,
        lastUsedAt: k.lastUsedAt,
        lastUsedIp: k.lastUsedIp,
        expiresAt: k.expiresAt,
        createdBy: k.createdBy,
        creatorEmail: k.creatorEmail,
        createdAt: k.createdAt,
        revokedAt: k.revokedAt,
        revokedReason: k.revokedReason,
      })),
      pagination: {
        page,
        limit,
        total: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
      availableScopes: AVAILABLE_SCOPES,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API keys list error:', err);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

// POST: Create a new API key
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const body = await req.json();
    const { name, scopes, expiresAt } = body as {
      name?: string;
      scopes?: string[];
      expiresAt?: string;
    };

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Name must be at least 3 characters' }, { status: 400 });
    }

    // Validate scopes
    const validScopes = (scopes || []).filter((s: string) => AVAILABLE_SCOPES.includes(s));

    // Generate the API key
    const { key, prefix } = generateApiKey();
    const keyHash = await hash(key);

    // Parse expiration date
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime()) || expiresAtDate <= new Date()) {
        return NextResponse.json({ error: 'Invalid or past expiration date' }, { status: 400 });
      }
    }

    // Insert the key
    const [inserted] = await db
      .insert(developerApiKeys)
      .values({
        name: name.trim(),
        prefix,
        keyHash,
        scopes: validScopes,
        expiresAt: expiresAtDate,
        createdBy: user.id,
      })
      .returning();

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'api_key.create',
      entityType: 'developer_api_key',
      entityId: inserted.id,
      message: `Created API key "${name.trim()}" with prefix ${prefix}`,
      meta: { scopes: validScopes, expiresAt: expiresAtDate?.toISOString() },
    });

    // Return the key ONCE - it won't be shown again
    return NextResponse.json({
      key: {
        id: inserted.id,
        name: inserted.name,
        prefix: inserted.prefix,
        scopes: inserted.scopes,
        status: inserted.status,
        expiresAt: inserted.expiresAt,
        createdAt: inserted.createdAt,
      },
      // This is the ONLY time the full key is returned
      secretKey: key,
      warning: 'Save this key now. It will not be shown again.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('API key create error:', err);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
