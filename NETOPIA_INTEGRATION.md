# Netopia Payment Gateway Integration

## Overview
This document describes the integration of Netopia payment gateway with FloristMarket, including test credentials and implementation details.

## Test Credentials

### Merchant Information
- **Merchant ID**: `33MN-RVFE-X0J6-TUTC-4ZJB`
- **Environment**: Test/Sandbox
- **Currency**: RON (Romanian Lei)

### Test Cards
For testing payments, use these test card numbers:

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4111111111111111 | 123 | 12/25 |
| Mastercard | 5555555555554444 | 123 | 12/25 |

## Implementation

### Files Created/Modified

1. **`lib/netopia.ts`** - Core Netopia integration logic
   - RSA signature generation and verification
   - Payment request creation
   - Callback data parsing

2. **`app/api/payments/netopia/create/route.ts`** - Payment creation API
   - Validates payment data
   - Creates Netopia payment request
   - Returns HTML form for auto-submission

3. **`app/api/payments/netopia/callback/route.ts`** - Payment callback handler
   - Handles both POST and GET callbacks
   - Verifies signatures
   - Processes payment status

4. **`components/payments/NetopiaPayment.tsx`** - React payment component
   - User-friendly payment interface
   - Handles payment initiation
   - Error handling and loading states

5. **`app/test-netopia/page.tsx`** - Test page for integration
   - Interactive testing interface
   - Configuration options
   - Test information display

### Environment Variables

Add these to your `.env.local` file:

```env
# Payment Gateway - Netopia Test
NETOPIA_MERCHANT_ID=33MN-RVFE-X0J6-TUTC-4ZJB
NETOPIA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----"
NETOPIA_PUBLIC_CERT="-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----"
```

## Usage

### Testing the Integration

1. **Visit the test page**: `http://localhost:3001/test-netopia`
2. **Configure payment details**:
   - Order ID (auto-generated)
   - Amount in RON
   - Description
3. **Click "Inițiază Plata Test"**
4. **Use test card numbers** provided above

### API Endpoints

#### Create Payment
```http
POST /api/payments/netopia/create
Content-Type: application/json

{
  "orderId": "TEST-123456",
  "amount": 100,
  "currency": "RON",
  "description": "Test payment"
}
```

#### Payment Callback
```http
POST /api/payments/netopia/callback
Content-Type: application/x-www-form-urlencoded

order_id=TEST-123456&status=success&amount=100&currency=RON&signature=...
```

### React Component Usage

```tsx
import { NetopiaPayment } from '@/components/payments/NetopiaPayment';

<NetopiaPayment
  orderId="ORDER-123"
  amount={150}
  currency="RON"
  description="Payment for flowers"
  onSuccess={() => console.log('Payment successful!')}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

## Security Features

1. **RSA Signature Generation**: All payment requests are signed with RSA-SHA256
2. **Signature Verification**: Callbacks are verified using the public certificate
3. **Parameter Validation**: Input validation for all payment data
4. **Error Handling**: Comprehensive error handling and logging

## Production Considerations

1. **Environment Variables**: Move test credentials to environment variables
2. **Certificate Management**: Use proper certificate management in production
3. **Logging**: Implement proper logging for payment events
4. **Database Integration**: Connect with order management system
5. **Email Notifications**: Send confirmation emails on successful payments
6. **Inventory Updates**: Update product inventory after successful payments

## Troubleshooting

### Common Issues

1. **Empty Merchant ID**: Check environment variables are properly set
2. **Signature Errors**: Verify private key format and certificate validity
3. **Callback Issues**: Ensure callback URL is accessible from Netopia servers
4. **Test Card Rejection**: Use only the provided test card numbers

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## Support

For Netopia-specific issues, contact Netopia support with your merchant ID: `33MN-RVFE-X0J6-TUTC-4ZJB`
