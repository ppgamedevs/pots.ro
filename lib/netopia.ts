import crypto from 'crypto';
import { NETOPIA_MERCHANT_ID, NETOPIA_PRIVATE_KEY, NETOPIA_PUBLIC_CERT, NETOPIA_API_KEY, NETOPIA_POS_SIGNATURE, SITE_URL } from './env';

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
      // Note: Classic MobilPay uses different endpoint structure
      gatewayUrl = 'https://sandboxsecure.mobilpay.ro/payment/request';
    } else {
      // Production environment - use classic MobilPay endpoint for form submission
      gatewayUrl = 'https://secure.mobilpay.ro/payment/request';
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

/**
 * Create Netopia v2 JSON API payment request
 * This uses the new Netopia v2 API with JSON instead of form submission
 */
export async function createNetopiaV2PaymentRequest(
  request: NetopiaPaymentRequest & {
    billing?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    };
  }
): Promise<NetopiaPaymentResponse> {
  // POS Signature = Merchant ID (identifică punctul de vânzare)
  // Aceasta este "Semnătura" din panoul Netopia
  const posSignature = NETOPIA_POS_SIGNATURE || MERCHANT_ID;
  
  // API Key = cheie separată generată din Profil -> Securitate în panoul Netopia
  // NU este același lucru cu "Semnătura"!
  const apiKey = NETOPIA_API_KEY;
  const isLive = process.env.NODE_ENV === 'production' && MERCHANT_ID !== TEST_MERCHANT_ID;

  if (!apiKey) {
    throw new Error('NETOPIA_API_KEY is required for v2 API integration');
  }

  // Determine API base URL
  // For Netopia v2 API, the endpoint is /payment/card/start (without /pay/ prefix)
  const baseUrl = isLive 
    ? 'https://secure.mobilpay.ro'
    : 'https://secure.sandbox.netopia-payments.com';

  const endpoint = `${baseUrl}/payment/card/start`;

  // Prepare payment request according to Netopia v2 API
  // Based on Netopia v2 documentation structure
  const requestBody = {
    config: {
      emailTemplate: '',
      notifyUrl: request.confirmUrl,
      redirectUrl: request.returnUrl,
      language: 'ro'  // Netopia requires lowercase 2-letter code
    },
    order: {
      ntpID: request.orderId.substring(0, 32), // Netopia max 32 chars
      posSignature: posSignature,
      dateTime: new Date().toISOString(),
      description: request.description.substring(0, 100), // Limit description length
      orderID: request.orderId,
      amount: request.amount,
      currency: request.currency || 'RON', // Ensure currency is set (3 chars required)
      billing: {
        email: request.billing?.email || 'customer@example.com',
        phone: request.billing?.phone || '0700000000',
        firstName: request.billing?.firstName || 'Customer',
        lastName: request.billing?.lastName || 'Name',
        city: request.billing?.city || 'Bucharest',
        country: parseInt(request.billing?.country || '642'), // Romania country code as number
        postalCode: request.billing?.postalCode || '000000'
      }
    }
  };

  // Make API request
  // Netopia v2 API uses API Key directly in Authorization header (not Bearer token)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey, // Netopia uses API key directly, not Bearer token
        'X-POS-Signature': posSignature
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Try to get detailed error information
      let errorMessage = `Netopia API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
        console.error('Netopia API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          endpoint,
          hasApiKey: !!apiKey,
          apiKeyPrefix: apiKey?.substring(0, 10) + '...'
        });
      } catch (e) {
        const errorText = await response.text().catch(() => '');
        errorMessage += ` - ${errorText || 'Unknown error'}`;
        console.error('Netopia API error response (text):', errorText);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    // Handle response according to Netopia v2 API
    if (responseData.data?.error?.code === '100' && 
        responseData.data?.payment?.status === 15) {
      // Redirect to 3D Secure authentication
      const authUrl = responseData.data.customerAction?.url;
      return {
        gateway: 'netopia',
        redirectUrl: authUrl
      };
    } else if (responseData.data?.error?.code === '0' && 
               responseData.data?.payment?.status === 3) {
      // Payment successful (no 3D Secure required)
      return {
        gateway: 'netopia',
        redirectUrl: request.returnUrl
      };
    } else {
      throw new Error(`Payment failed: ${responseData.data?.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Netopia v2 API error:', error);
    throw error;
  }
}
