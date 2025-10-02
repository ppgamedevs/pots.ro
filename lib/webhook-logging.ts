import { db } from '@/db';
import { webhookLogs } from '@/db/schema/core';

export type WebhookSource = 'payments' | 'shipping' | 'invoices';
export type WebhookResult = 'ok' | 'duplicate' | 'error';

export interface WebhookLogData {
  source: WebhookSource;
  ref?: string;
  payload: any;
  result?: WebhookResult;
}

export async function logWebhook(data: WebhookLogData): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      source: data.source,
      ref: data.ref,
      payload: data.payload,
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
