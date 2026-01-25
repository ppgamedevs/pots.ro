import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

// Compute fingerprint for audit purposes
function computeFingerprint(value: string | undefined): string | null {
  if (!value) return null;
  const hash = crypto.createHash('sha256').update(value).digest('hex');
  return hash.slice(0, 8);
}

/**
 * This endpoint doesn't actually rotate credentials in runtime (since env vars are immutable).
 * Instead, it:
 * 1. Validates that the caller intends to rotate credentials
 * 2. Logs the rotation request for audit purposes
 * 3. Returns instructions for the admin to update credentials in environment/vault
 * 
 * In a production setup with a secrets manager (e.g., AWS Secrets Manager, Vault),
 * this endpoint would call the secrets manager API to rotate the credentials.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 2 rotations per hour per admin
    await checkRateLimit(`admin_invoicing_rotate_${user.id}`, 2, 60 * 60 * 1000);

    const body = await req.json().catch(() => ({}));
    const provider = String(body?.provider || 'smartbill').toLowerCase();
    const confirmRotation = body?.confirm === true;

    if (!confirmRotation) {
      return NextResponse.json({
        ok: false,
        error: 'Rotation not confirmed. Set confirm: true to proceed.',
        instructions: [
          '1. Generate new credentials in the provider dashboard',
          '2. Update environment variables in Vercel/hosting platform',
          '3. Confirm rotation with this endpoint',
          '4. Verify integration status after deployment',
        ],
      }, { status: 400 });
    }

    const activeProvider = process.env.INVOICE_PROVIDER || 'mock';

    // Get current fingerprints for audit
    let currentFingerprints: Record<string, string | null> = {};
    
    if (provider === 'smartbill') {
      currentFingerprints = {
        SMARTBILL_USERNAME: computeFingerprint(process.env.SMARTBILL_USERNAME),
        SMARTBILL_TOKEN: computeFingerprint(process.env.SMARTBILL_TOKEN),
      };
    } else if (provider === 'facturis') {
      currentFingerprints = {
        FACTURIS_API_KEY: computeFingerprint(process.env.FACTURIS_API_KEY),
      };
    }

    // Audit log the rotation request
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'invoicing_credentials_rotation_requested',
      entityType: 'integration',
      entityId: 'invoicing',
      message: `Invoice provider credentials rotation requested for ${provider}`,
      meta: {
        provider,
        activeProvider,
        currentFingerprints,
        rotationRequestedAt: new Date().toISOString(),
      },
    });

    // In a real implementation with a secrets manager:
    // await secretsManager.rotateSecret(`invoice_${provider}_credentials`);

    return NextResponse.json({
      ok: true,
      message: `Credentials rotation request logged for ${provider}. Follow manual steps to complete rotation.`,
      currentFingerprints,
      nextSteps: [
        `1. Log into ${provider === 'smartbill' ? 'SmartBill Cloud' : 'Facturis'} dashboard`,
        '2. Generate new API credentials',
        '3. Update environment variables in Vercel project settings',
        '4. Redeploy the application',
        '5. Verify with the /test endpoint',
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    if (message.includes('Rate limit')) {
      return NextResponse.json({ ok: false, error: message }, { status: 429 });
    }
    const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
