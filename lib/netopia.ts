import crypto from 'crypto';
import { NETOPIA_MERCHANT_ID, NETOPIA_PRIVATE_KEY, SITE_URL } from './env';

export interface NetopiaPaymentRequest {
  orderId: string;
  amount: number; // in RON (not cents)
  currency: string;
  description: string;
  returnUrl: string;
  confirmUrl: string;
}

export interface NetopiaPaymentResponse {
  gateway: string;
  formHtml?: string;
  redirectUrl?: string;
}

export interface NetopiaCallbackData {
  orderId: string;
  status: string;
  amount: string;
  currency: string;
  signature: string;
}

/**
 * Generate signature for Netopia payment request
 * MVP implementation - in production, use proper RSA signing
 */
export function generateNetopiaSignature(data: Record<string, string>): string {
  if (!NETOPIA_PRIVATE_KEY) {
    console.warn('NETOPIA_PRIVATE_KEY not set, using mock signature');
    return 'mock_signature_' + crypto.randomBytes(16).toString('hex');
  }

  // Sort parameters and create query string
  const sortedParams = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');

  // MVP: Use HMAC-SHA256 instead of RSA (for production, implement proper RSA signing)
  const signature = crypto
    .createHmac('sha256', NETOPIA_PRIVATE_KEY)
    .update(sortedParams)
    .digest('hex');

  return signature;
}

/**
 * Verify Netopia callback signature
 */
export function verifyNetopiaSignature(data: Record<string, string>, signature: string): boolean {
  if (!NETOPIA_PRIVATE_KEY) {
    console.warn('NETOPIA_PRIVATE_KEY not set, skipping signature verification');
    return true; // Allow in development
  }

  const expectedSignature = generateNetopiaSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Create Netopia payment request
 */
export function createNetopiaPaymentRequest(request: NetopiaPaymentRequest): NetopiaPaymentResponse {
  const paymentData: Record<string, string> = {
    merchant_id: NETOPIA_MERCHANT_ID,
    order_id: request.orderId,
    amount: request.amount.toString(),
    currency: request.currency,
    description: request.description,
    return_url: request.returnUrl,
    confirm_url: request.confirmUrl,
    timestamp: Date.now().toString(),
  };

  const signature = generateNetopiaSignature(paymentData);
  paymentData.signature = signature;

  // MVP: Return HTML form for auto-submission
  const formHtml = `
    <form id="netopia-payment-form" method="POST" action="https://secure.netopia.ro/payment/process">
      ${Object.entries(paymentData).map(([key, value]) => 
        `<input type="hidden" name="${key}" value="${value}" />`
      ).join('')}
    </form>
    <script>
      document.getElementById('netopia-payment-form').submit();
    </script>
  `;

  return {
    gateway: 'netopia',
    formHtml: formHtml.trim(),
  };
}

/**
 * Parse Netopia callback data
 */
export function parseNetopiaCallback(formData: FormData): NetopiaCallbackData {
  return {
    orderId: formData.get('order_id') as string,
    status: formData.get('status') as string,
    amount: formData.get('amount') as string,
    currency: formData.get('currency') as string,
    signature: formData.get('signature') as string,
  };
}

/**
 * Check if Netopia payment was successful
 */
export function isNetopiaPaymentSuccess(status: string): boolean {
  return status === 'success' || status === 'paid' || status === 'confirmed';
}
