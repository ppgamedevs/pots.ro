import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';
import { createAlert, AlertSeverity, AlertSource } from '@/lib/admin/alerts';

export type WebhookSource = 'payments' | 'shipping' | 'invoices' | 'orders' | 'refunds' | 'payouts' | 'whatsapp' | 'chatbot';
export type WebhookResult = 'ok' | 'duplicate' | 'error';

export interface WebhookLogData {
  source: WebhookSource;
  ref?: string;
  payload: any;
  result?: WebhookResult;
}

const DEFAULT_MAX_STRING_LENGTH = 4096;
const DEFAULT_MAX_KEYS_PER_OBJECT = 200;
const DEFAULT_MAX_DEPTH = 8;

const SENSITIVE_KEYS = new Set([
  'authorization',
  'auth',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'secretkey',
  'private_key',
  'password',
  'signature',
  'card',
  'pan',
  'cvv',
  'cvc',
  'iban',
  'account',
  'secretCode',
]);

function truncateString(value: string, maxLen: number) {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen) + `…[truncated:${value.length - maxLen}]`;
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (!value) return value;
    const trimmed = value.trim();
    if (trimmed.length <= 8) return '***';
    return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  }
  return '***';
}

/**
 * Best-effort redaction for webhook payloads.
 * - Masks known sensitive keys
 * - Limits depth/size to avoid storing huge blobs
 */
export function redactWebhookPayload(
  payload: any,
  opts: {
    maxStringLength?: number;
    maxKeysPerObject?: number;
    maxDepth?: number;
  } = {}
): any {
  const maxStringLength = opts.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  const maxKeysPerObject = opts.maxKeysPerObject ?? DEFAULT_MAX_KEYS_PER_OBJECT;
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;

  const seen = new WeakSet<object>();

  const walk = (value: any, depth: number): any => {
    if (depth > maxDepth) return '[max_depth]';
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') return truncateString(value, maxStringLength);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) {
      return value.slice(0, 200).map((v) => walk(v, depth + 1));
    }

    if (typeof value === 'object') {
      if (seen.has(value)) return '[circular]';
      seen.add(value);

      const entries = Object.entries(value as Record<string, any>);
      const limited = entries.slice(0, maxKeysPerObject);
      const out: Record<string, any> = {};

      for (const [key, v] of limited) {
        const lower = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lower)) {
          out[key] = redactValue(v);
          continue;
        }
        out[key] = walk(v, depth + 1);
      }

      if (entries.length > limited.length) {
        out.__truncated_keys__ = entries.length - limited.length;
      }

      return out;
    }

    return String(value);
  };

  return walk(payload, 0);
}

export async function logWebhook(data: WebhookLogData): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      source: data.source,
      ref: data.ref,
      payload: redactWebhookPayload(data.payload),
      result: data.result || 'ok',
    });
  } catch (error) {
    console.error('Failed to log webhook:', error);
    // Don't throw - webhook logging should not break the main flow
  }
}

export async function logWebhookError(
  source: WebhookSource,
  ref: string | undefined,
  payload: any,
  error: Error
): Promise<void> {
  await logWebhook({
    source,
    ref,
    payload: {
      ...payload,
      error: error.message,
      stack: error.stack,
    },
    result: 'error',
  });

  // Create admin alert for webhook failure
  try {
    const alertSource: AlertSource = source === 'payments' ? 'payment_error' : 'webhook_failure';
    const severity: AlertSeverity = source === 'payments' ? 'high' : 'medium';
    const dedupeKey = `webhook:${source}:${ref || 'unknown'}:${error.message.slice(0, 50)}`;

    await createAlert({
      source: alertSource,
      type: `${source}_webhook_error`,
      severity,
      dedupeKey,
      entityType: 'webhook',
      entityId: ref,
      title: `Webhook ${source} eșuat: ${error.message.slice(0, 100)}`,
      details: {
        source,
        ref,
        errorMessage: error.message,
        provider: payload?.provider,
      },
    });
  } catch (alertError) {
    console.error('Failed to create alert for webhook error:', alertError);
    // Don't throw - alert creation should not break the main flow
  }
}

export async function logWebhookDuplicate(
  source: WebhookSource,
  ref: string | undefined,
  payload: any
): Promise<void> {
  await logWebhook({
    source,
    ref,
    payload,
    result: 'duplicate',
  });
}
