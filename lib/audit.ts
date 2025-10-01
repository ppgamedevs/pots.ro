import { db } from "@/db";
import { auditLogs } from "@/db/schema/core";
import { eq, desc } from "drizzle-orm";

export type AuditAction = 
  | 'pack' 
  | 'ship' 
  | 'deliver' 
  | 'cancel' 
  | 'refund'
  | 'webhook_update'
  | 'status_change'
  | 'awb_created'
  | 'message_sent'
  | 'conversation_created';

export interface AuditMeta {
  [key: string]: any;
}

export interface LogOrderActionParams {
  orderId: string;
  actorId?: string;
  actorRole?: string;
  action: AuditAction;
  meta?: AuditMeta;
}

/**
 * Log an order action to the audit trail
 * @param params Order action parameters
 * @returns Promise<void>
 */
export async function logOrderAction(params: LogOrderActionParams): Promise<void> {
  const { orderId, actorId, actorRole, action, meta } = params;
  
  await db.insert(auditLogs).values({
    orderId,
    actorId: actorId || null,
    actorRole: actorRole || null,
    action,
    meta: meta || null,
  });
}

/**
 * Log a status change with transition details
 * @param orderId Order ID
 * @param from Previous status
 * @param to New status
 * @param actorId User ID who made the change
 * @param actorRole Role of the user
 * @param meta Additional metadata
 */
export async function logStatusChange(
  orderId: string,
  from: string,
  to: string,
  actorId?: string,
  actorRole?: string,
  meta?: AuditMeta
): Promise<void> {
  await logOrderAction({
    orderId,
    actorId,
    actorRole,
    action: 'status_change',
    meta: {
      from,
      to,
      ...meta,
    },
  });
}

/**
 * Log AWB creation
 * @param orderId Order ID
 * @param awbNumber AWB number
 * @param carrier Carrier name
 * @param actorId User ID who created the AWB
 * @param actorRole Role of the user
 */
export async function logAwbCreation(
  orderId: string,
  awbNumber: string,
  carrier: string,
  actorId?: string,
  actorRole?: string
): Promise<void> {
  await logOrderAction({
    orderId,
    actorId,
    actorRole,
    action: 'awb_created',
    meta: {
      awbNumber,
      carrier,
    },
  });
}

/**
 * Log webhook update
 * @param orderId Order ID
 * @param provider Webhook provider
 * @param eventId Event ID from provider
 * @param status New delivery status
 * @param meta Additional webhook metadata
 */
export async function logWebhookUpdate(
  orderId: string,
  provider: string,
  eventId: string,
  status: string,
  meta?: AuditMeta
): Promise<void> {
  await logOrderAction({
    orderId,
    action: 'webhook_update',
    meta: {
      provider,
      eventId,
      status,
      ...meta,
    },
  });
}

/**
 * Log message sent in conversation
 * @param orderId Order ID
 * @param conversationId Conversation ID
 * @param senderId User ID who sent the message
 * @param senderRole Role of the sender
 * @param messageLength Length of the message
 * @param hasWarning Whether message had contact info redacted
 */
export async function logMessageSent(
  orderId: string,
  conversationId: string,
  senderId: string,
  senderRole: string,
  messageLength: number,
  hasWarning: boolean = false
): Promise<void> {
  await logOrderAction({
    orderId,
    actorId: senderId,
    actorRole: senderRole,
    action: 'message_sent',
    meta: {
      conversationId,
      messageLength,
      hasWarning,
    },
  });
}

/**
 * Log conversation creation
 * @param orderId Order ID
 * @param conversationId Conversation ID
 * @param buyerId Buyer user ID
 * @param sellerId Seller user ID
 */
export async function logConversationCreated(
  orderId: string,
  conversationId: string,
  buyerId: string,
  sellerId: string
): Promise<void> {
  await logOrderAction({
    orderId,
    action: 'conversation_created',
    meta: {
      conversationId,
      buyerId,
      sellerId,
    },
  });
}

/**
 * Get audit trail for an order
 * @param orderId Order ID
 * @param limit Maximum number of entries to return
 * @returns Promise<AuditLog[]>
 */
export async function getOrderAuditTrail(orderId: string, limit: number = 50) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.orderId, orderId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
