import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { checkRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    // Rate limit: max 5 tests per minute per admin
    await checkRateLimit(`admin_invoicing_test_${user.id}`, 5, 60_000);

    const activeProvider = process.env.INVOICE_PROVIDER || 'mock';

    // Test based on active provider
    let testResult: { success: boolean; message: string; latencyMs: number };
    const startTime = Date.now();

    if (activeProvider === 'mock') {
      // Mock provider always succeeds
      testResult = {
        success: true,
        message: 'Mock invoice provider is active. Connection test simulated.',
        latencyMs: Date.now() - startTime,
      };
    } else if (activeProvider === 'smartbill') {
      // Test SmartBill connection
      const username = process.env.SMARTBILL_USERNAME;
      const token = process.env.SMARTBILL_TOKEN;
      const apiBase = process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api';

      if (!username || !token) {
        testResult = {
          success: false,
          message: 'SmartBill credentials not configured (SMARTBILL_USERNAME, SMARTBILL_TOKEN)',
          latencyMs: Date.now() - startTime,
        };
      } else {
        try {
          // SmartBill doesn't have a dedicated health endpoint, so we test with a GET to /email
          // which returns company info if authenticated
          const response = await fetch(`${apiBase}/email?cif=${process.env.COMPANY_VAT_NUMBER || ''}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
            },
          });

          const latencyMs = Date.now() - startTime;

          if (response.ok || response.status === 404) {
            // 404 is acceptable - means auth worked but endpoint/CIF not found
            testResult = {
              success: true,
              message: `SmartBill connection successful. Status: ${response.status}`,
              latencyMs,
            };
          } else if (response.status === 401 || response.status === 403) {
            testResult = {
              success: false,
              message: `SmartBill authentication failed. Status: ${response.status}`,
              latencyMs,
            };
          } else {
            testResult = {
              success: false,
              message: `SmartBill returned unexpected status: ${response.status}`,
              latencyMs,
            };
          }
        } catch (fetchError) {
          testResult = {
            success: false,
            message: `SmartBill connection failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } else if (activeProvider === 'facturis') {
      // Test Facturis connection
      const apiKey = process.env.FACTURIS_API_KEY;
      const apiBase = process.env.FACTURIS_API_BASE || 'https://api.facturis.ro/v1';

      if (!apiKey) {
        testResult = {
          success: false,
          message: 'Facturis credentials not configured (FACTURIS_API_KEY)',
          latencyMs: Date.now() - startTime,
        };
      } else {
        try {
          // Test with a simple GET to check auth
          const response = await fetch(`${apiBase}/status`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          const latencyMs = Date.now() - startTime;

          if (response.ok) {
            testResult = {
              success: true,
              message: `Facturis connection successful. Status: ${response.status}`,
              latencyMs,
            };
          } else if (response.status === 401 || response.status === 403) {
            testResult = {
              success: false,
              message: `Facturis authentication failed. Status: ${response.status}`,
              latencyMs,
            };
          } else {
            testResult = {
              success: false,
              message: `Facturis returned unexpected status: ${response.status}`,
              latencyMs,
            };
          }
        } catch (fetchError) {
          testResult = {
            success: false,
            message: `Facturis connection failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } else {
      testResult = {
        success: false,
        message: `Unknown invoice provider: ${activeProvider}`,
        latencyMs: Date.now() - startTime,
      };
    }

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'invoicing_connection_test',
      entityType: 'integration',
      entityId: 'invoicing',
      message: `Invoice provider connection test: ${testResult.success ? 'success' : 'failed'}`,
      meta: {
        provider: activeProvider,
        success: testResult.success,
        message: testResult.message,
        latencyMs: testResult.latencyMs,
      },
    });

    return NextResponse.json({
      ok: testResult.success,
      result: testResult,
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
