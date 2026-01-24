import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { developerWebhookEndpoints } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { hash } from '@/lib/auth/crypto';

// Generate a new webhook signing secret
function generateWebhookSecret(): { secret: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  const prefix = `whsec_${randomBytes.slice(0, 8)}`;
  const secret = `${prefix}_${randomBytes}`;
  return { secret, prefix };
}

// POST: Rotate webhook signing secret
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, ['admin']);

    const endpoint = await db.query.developerWebhookEndpoints.findFirst({
      where: eq(developerWebhookEndpoints.id, params.id),
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    // Generate new secret
    const { secret, prefix } = generateWebhookSecret();
    const secretHash = await hash(secret);

    // Update with new secret
    const [updated] = await db
      .update(developerWebhookEndpoints)
      .set({
        secretHash,
        secretPrefix: prefix,
        secretCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(developerWebhookEndpoints.id, params.id))
      .returning();

    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'webhook_endpoint.rotate_secret',
      entityType: 'developer_webhook_endpoint',
      entityId: params.id,
      message: `Rotated signing secret for webhook endpoint "${endpoint.name}" from ${endpoint.secretPrefix} to ${prefix}`,
      meta: { oldPrefix: endpoint.secretPrefix, newPrefix: prefix },
    });

    return NextResponse.json({
      endpoint: {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        status: updated.status,
        secretPrefix: updated.secretPrefix,
        secretCreatedAt: updated.secretCreatedAt,
      },
      // This is the ONLY time the new secret is returned
      signingSecret: secret,
      warning: 'Save this signing secret now. It will not be shown again. The old secret is now invalid.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Webhook secret rotate error:', err);
    return NextResponse.json({ error: 'Failed to rotate webhook secret' }, { status: 500 });
  }
}
