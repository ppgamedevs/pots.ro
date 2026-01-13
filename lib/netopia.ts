import crypto from 'crypto';
import { NETOPIA_MERCHANT_ID, NETOPIA_PRIVATE_KEY, NETOPIA_PUBLIC_CERT, SITE_URL } from './env';

// Netopia gateway URL - can be overridden via environment variable
const NETOPIA_GATEWAY_URL = process.env.NETOPIA_GATEWAY_URL;

// Test credentials - replace with environment variables in production
const TEST_MERCHANT_ID = '33MN-RVFE-X0J6-TUTC-4ZJB';
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICeAIBADANBgkqhkiG9w0BAQEFAASCAmIwggJeAgEAAoGBAPWF5TRG+VH3kcWa
cheCdCB/EwUZYFELepVGldTsDIt/w7h9Bi/55+Eq0HjBp9zqMrz90jZh67akEQKb
x1ilA87XkrBKXTvGzyszglz6UbfLhuLg1UfmjJst9cOtwPOAdL30wNewKHv2uJio
wqqolt+OImKm0MO0/+MM/z8n4szPAgMBAAECgYEA8JL6O3cv5TkIBO+Iy7BvyUe6
g0ySK9drjclUFwYUZLwUMzmOToQ4yVECZNCcgsKYZMbwq4jXRmcMo9mwQxOt3Zvc
ukwcwbnhDbUY2pgEr+SMasYzEErg+pJLhLkWCs8tJL+YppV30+i9JT9LelekBwY3
bQmWdbaLv56P+5w7QIECQQD7SmicemdHGwmhEz13nbOynmP0h5nXY3yFYYkKmUSn
R6VpunCD9G3thIBJfFVyg4EDHqOQIMekypTcd8XRAmHJAkEA+h/Q4Hia8EXJA6hf
ATkaasI6R79ZriOUpa82wo7W2jqSGQ1UtujY3n7TuNuE0GjISgYwbhcowabJKEVJ
5gvF1wJAVjYM9cI4tHheMVi8edEs2Vbly/rJmM+U5N21emFi4FEAOumvuFWfcSFI
Me3qEsNy+3MDgmr8k1i9AXZF85LxoQJBALRifaFlWVgu++lHZDzdkc+sg5t6xJJx
1qIm2rc1jH2WAAdRNeczxjOwA8Etj3s+FjRMgmDjEuGWBzyju8fMdcECQQCj/DtM
+b7wtPqMtet6cbf8Mc45vJnvmIpviG/BMYi8dlQFty1gzw/dyn4CLNM47umAVxTR
9JSX2ToP3Qt102qK
-----END PRIVATE KEY-----`;

const TEST_PUBLIC_CERT = `-----BEGIN CERTIFICATE-----
MIIC3zCCAkigAwIBAgIBATANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCUk8x
EjAQBgNVBAgTCUJ1Y2hhcmVzdDESMBAGA1UEBxMJQnVjaGFyZXN0MRAwDgYDVQQK
EwdORVRPUElBMSEwHwYDVQQLExhORVRPUElBIERldmVsb3BtZW50IHRlYW0xHDAa
BgNVBAMTE25ldG9waWEtcGF5bWVudHMucm8wHhcNMjUxMDA4MTM0NTEwWhcNMzUx
MDA2MTM0NTEwWjCBiDELMAkGA1UEBhMCUk8xEjAQBgNVBAgTCUJ1Y2hhcmVzdDES
MBAGA1UEBxMJQnVjaGFyZXN0MRAwDgYDVQQKEwdORVRPUElBMSEwHwYDVQQLExhO
RVRPUElBIERldmVsb3BtZW50IHRlYW0xHDAaBgNVBAMTE25ldG9waWEtcGF5bWVu
dHMucm8wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBALwh0/NhEpZFuKvghZ9N
75CXba05MWNCh422kcfFKbqP5YViCUBg3Mc5ZYd1e0Xi9Ui1QI2Z/jvvchrDZGQw
jarApr3S9bowHEkZH81ZolOoPHBZbYpA28BIyHYRcaTXjLtiBGvjpwuzljmXeBoV
LinIaE0IUpMen9MLWG2fGMddAgMBAAGjVzBVMA4GA1UdDwEB/wQEAwIFoDATBgNV
HSUEDDAKBggrBgEFBQcDATAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQ9yXCh
MGxzUzQflmkXT1oyIBoetTANBgkqhkiG9w0BAQsFAAOBgQA6gTeT639EpOiTEz8N
PfJ24Ydxu6TrFfWVJ02rQQtDt/ryVzJxZrd+BYUpP0b2mFf1VpndcOSax0NSrbcs
2coHRqFEyiYRX+3tAMf1lTN1f6Zt6MI4eqC4ZAnN1NWoUS2gNhybNg6jkY31XCrx
yq6lLfx9BNWCPXp5RpYHnfcjRQ==
-----END CERTIFICATE-----`;

// Use test credentials if environment variables are not set
const MERCHANT_ID = NETOPIA_MERCHANT_ID || TEST_MERCHANT_ID;
const PRIVATE_KEY = NETOPIA_PRIVATE_KEY || TEST_PRIVATE_KEY;
const PUBLIC_CERT = NETOPIA_PUBLIC_CERT || TEST_PUBLIC_CERT;

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

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
 * Generate RSA signature for Netopia payment request
 */
export function generateNetopiaSignature(data: Record<string, string>): string {
  if (!PRIVATE_KEY) {
    console.warn('PRIVATE_KEY not set, using mock signature');
    return 'mock_signature_' + crypto.randomBytes(16).toString('hex');
  }

  try {
    // Sort parameters and create query string
    const sortedParams = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');

    // Create RSA signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(sortedParams, 'utf8');
    
    // Convert private key format for Node.js crypto
    const privateKey = PRIVATE_KEY.replace(/\\n/g, '\n');
    const signature = sign.sign(privateKey, 'base64');
    
    return signature;
  } catch (error) {
    console.error('Error generating Netopia signature:', error);
    // Fallback to HMAC for development
    const sortedParams = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', 'fallback_key')
      .update(sortedParams)
      .digest('hex');
  }
}

/**
 * Verify Netopia callback signature using public certificate
 */
export function verifyNetopiaSignature(data: Record<string, string>, signature: string): boolean {
  if (!PUBLIC_CERT) {
    console.warn('PUBLIC_CERT not set, skipping signature verification');
    return true; // Allow in development
  }

  try {
    // Sort parameters and create query string
    const sortedParams = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');

    // Create verifier
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(sortedParams, 'utf8');
    
    // Convert certificate format for Node.js crypto
    const publicCert = PUBLIC_CERT.replace(/\\n/g, '\n');
    
    return verify.verify(publicCert, signature, 'base64');
  } catch (error) {
    console.error('Error verifying Netopia signature:', error);
    return false;
  }
}

/**
 * Create Netopia payment request
 */
export function createNetopiaPaymentRequest(request: NetopiaPaymentRequest): NetopiaPaymentResponse {
  const paymentData: Record<string, string> = {
    merchant_id: MERCHANT_ID,
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

  // Determine Netopia gateway URL
  // Use environment variable if set, otherwise use default based on environment
  let gatewayUrl = NETOPIA_GATEWAY_URL;
  
  if (!gatewayUrl) {
    // Netopia/MobilPay payment gateway URL
    // For form-based submission (classic MobilPay), use the standard endpoint
    // The v2 API endpoints require JSON API, but we're using form submission
    const isTestEnvironment = MERCHANT_ID === TEST_MERCHANT_ID || process.env.NODE_ENV !== 'production';
    
    if (isTestEnvironment) {
      // Sandbox/test environment - use classic MobilPay endpoint for form submission
      gatewayUrl = 'https://sandboxsecure.mobilpay.ro/pay/payment/card/start';
    } else {
      // Production environment - use classic MobilPay endpoint for form submission
      gatewayUrl = 'https://secure.mobilpay.ro/pay/payment/card/start';
    }
  }

  // Return HTML form for auto-submission to Netopia
  const formHtml = `
    <form id="netopia-payment-form" method="POST" action="${gatewayUrl}">
      ${Object.entries(paymentData).map(([key, value]) => 
        `<input type="hidden" name="${key}" value="${escapeHtml(value)}" />`
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
