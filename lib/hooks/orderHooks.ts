import { emailService } from '@/lib/email';
import { OrderPaidEmail } from '@/lib/email/templates/OrderPaid';
import { OrderShippedEmail } from '@/lib/email/templates/OrderShipped';
import { OrderDeliveredEmail } from '@/lib/email/templates/OrderDelivered';
import { MessageCreatedEmail } from '@/lib/email/templates/MessageCreated';

export async function sendOrderPaidEmail(
  orderId: string,
  buyerEmail: string,
  buyerName: string,
  total: number,
  currency: string,
  invoiceUrl?: string
) {
  try {
    const result = await emailService.sendEmailWithRetry({
      to: buyerEmail,
      subject: `Order Confirmed - #${orderId.slice(-8).toUpperCase()}`,
      template: OrderPaidEmail({
        orderId,
        buyerName,
        total,
        currency,
        invoiceUrl,
      }),
    });

    await emailService.logEmailEvent(
      'order_paid',
      buyerEmail,
      result.success ? 'sent' : 'failed',
      { orderId, total, currency },
      result.error
    );

    return result;
  } catch (error) {
    console.error('Send order paid email error:', error);
    await emailService.logEmailEvent(
      'order_paid',
      buyerEmail,
      'failed',
      { orderId },
      error instanceof Error ? error.message : 'Unknown error'
    );
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendOrderShippedEmail(
  orderId: string,
  buyerEmail: string,
  buyerName: string,
  awbNumber?: string,
  carrier?: string,
  trackingUrl?: string
) {
  try {
    const result = await emailService.sendEmailWithRetry({
      to: buyerEmail,
      subject: `Order Shipped - #${orderId.slice(-8).toUpperCase()}`,
      template: OrderShippedEmail({
        orderId,
        buyerName,
        awbNumber,
        carrier,
        trackingUrl,
      }),
    });

    await emailService.logEmailEvent(
      'order_shipped',
      buyerEmail,
      result.success ? 'sent' : 'failed',
      { orderId, awbNumber, carrier },
      result.error
    );

    return result;
  } catch (error) {
    console.error('Send order shipped email error:', error);
    await emailService.logEmailEvent(
      'order_shipped',
      buyerEmail,
      'failed',
      { orderId },
      error instanceof Error ? error.message : 'Unknown error'
    );
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendOrderDeliveredEmail(
  orderId: string,
  buyerEmail: string,
  buyerName: string,
  reviewUrl?: string
) {
  try {
    const result = await emailService.sendEmailWithRetry({
      to: buyerEmail,
      subject: `Order Delivered - #${orderId.slice(-8).toUpperCase()}`,
      template: OrderDeliveredEmail({
        orderId,
        buyerName,
        reviewUrl,
      }),
    });

    await emailService.logEmailEvent(
      'order_delivered',
      buyerEmail,
      result.success ? 'sent' : 'failed',
      { orderId },
      result.error
    );

    return result;
  } catch (error) {
    console.error('Send order delivered email error:', error);
    await emailService.logEmailEvent(
      'order_delivered',
      buyerEmail,
      'failed',
      { orderId },
      error instanceof Error ? error.message : 'Unknown error'
    );
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendMessageCreatedEmail(
  senderName: string,
  recipientEmail: string,
  recipientName: string,
  orderId: string,
  messagePreview: string,
  conversationUrl: string
) {
  try {
    const result = await emailService.sendEmailWithRetry({
      to: recipientEmail,
      subject: `New Message - Order #${orderId.slice(-8).toUpperCase()}`,
      template: MessageCreatedEmail({
        senderName,
        recipientName,
        orderId,
        messagePreview,
        conversationUrl,
      }),
    });

    await emailService.logEmailEvent(
      'message_created',
      recipientEmail,
      result.success ? 'sent' : 'failed',
      { orderId, senderName, messagePreview },
      result.error
    );

    return result;
  } catch (error) {
    console.error('Send message created email error:', error);
    await emailService.logEmailEvent(
      'message_created',
      recipientEmail,
      'failed',
      { orderId, senderName },
      error instanceof Error ? error.message : 'Unknown error'
    );
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
