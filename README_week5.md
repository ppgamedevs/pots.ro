# Week 5 MVP - API Testing Examples

This document provides curl examples for testing all the Week 5 MVP endpoints.

## Prerequisites

1. Set up authentication (login and get session cookie)
2. Have an existing order ID for testing
3. Set up environment variables for courier APIs (optional - will fallback to mock)

## Environment Variables

```bash
# Optional - if not set, providers will fallback to mock
CARGUS_API_BASE=https://api.cargus.ro
CARGUS_API_KEY=your_cargus_api_key
DPD_API_BASE=https://api.dpd.ro
DPD_API_KEY=your_dpd_api_key
```

## Order Status Endpoints

### 1. Pack Order (Seller)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/pack" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "order": {
    "id": "order_id",
    "status": "packed"
  }
}
```

### 2. Ship Order (Seller/Admin)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/ship" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "awbNumber": "AWB123456789"
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "order": {
    "id": "order_id",
    "status": "shipped",
    "awbNumber": "AWB123456789"
  }
}
```

### 3. Deliver Order (Admin)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/deliver" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "order": {
    "id": "order_id",
    "status": "delivered",
    "deliveredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Cancel Order (Admin)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/cancel" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "reason": "Customer requested cancellation"
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "order": {
    "id": "order_id",
    "status": "canceled",
    "canceledReason": "Customer requested cancellation"
  }
}
```

## AWB Endpoints

### 5. Create AWB (Seller)

```bash
curl -X POST "http://localhost:3000/api/shipping/awb" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "orderId": "order_id",
    "weightKg": 2.5
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "awb": {
    "awbNumber": "MOCK-abc123-4567",
    "awbLabelUrl": "/api/shipping/awb/order_id/label",
    "carrierMeta": {
      "provider": "mock",
      "weight": 2.5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "mockData": true
    }
  }
}
```

### 6. Download AWB Label

```bash
curl -X GET "http://localhost:3000/api/shipping/awb/{ORDER_ID}/label" \
  -H "Cookie: your_session_cookie" \
  -o "awb_label.pdf" \
  -v
```

**Expected Response:** PDF file download

## Webhook Endpoint

### 7. Shipping Webhook (Idempotent)

```bash
curl -X POST "http://localhost:3000/api/shipping/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mock",
    "eventId": "event_123",
    "orderId": "order_id",
    "status": "delivered",
    "meta": {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "location": "Bucharest, Romania"
    }
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Webhook processed successfully",
  "orderId": "order_id",
  "status": "delivered"
}
```

**Duplicate Webhook Test:**
```bash
# Run the same webhook again - should return duplicate: true
curl -X POST "http://localhost:3000/api/shipping/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mock",
    "eventId": "event_123",
    "orderId": "order_id",
    "status": "delivered"
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "duplicate": true,
  "message": "Webhook event already processed"
}
```

## Messaging Endpoints

### 8. Get/Create Conversation

```bash
curl -X GET "http://localhost:3000/api/conversations/{ORDER_ID}" \
  -H "Cookie: your_session_cookie" \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "conversationId": "conv_id",
  "orderId": "order_id",
  "buyerId": "buyer_id",
  "sellerId": "seller_id"
}
```

### 9. Send Message

```bash
curl -X POST "http://localhost:3000/api/messages/{CONVERSATION_ID}" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "body": "Hello, when will my order be shipped?"
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "message": {
    "id": "msg_id",
    "body": "Hello, when will my order be shipped?",
    "senderId": "user_id",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "warning": false
}
```

**Test Contact Filtering:**
```bash
curl -X POST "http://localhost:3000/api/messages/{CONVERSATION_ID}" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "body": "Please contact me at john@example.com or call 0712345678"
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "message": {
    "id": "msg_id",
    "body": "Please contact me at [redacted] or call [redacted]",
    "senderId": "user_id",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "warning": true
}
```

### 10. Get Messages

```bash
curl -X GET "http://localhost:3000/api/messages/{CONVERSATION_ID}" \
  -H "Cookie: your_session_cookie" \
  -v
```

**Expected Response:**
```json
{
  "ok": true,
  "messages": [
    {
      "id": "msg_id",
      "body": "Please contact me at [redacted] or call [redacted]",
      "senderId": "user_id",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Error Testing

### Invalid Status Transition (409 Conflict)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/pack" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -v
```

**Expected Response (if order is not in 'paid' status):**
```json
{
  "ok": false,
  "error": "Invalid transition from pending to packed"
}
```

### Unauthorized Access (403 Forbidden)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/pack" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response (without authentication):**
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

### Invalid Input (422 Unprocessable Entity)

```bash
curl -X POST "http://localhost:3000/api/orders/{ORDER_ID}/ship" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "awbNumber": ""
  }' \
  -v
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Invalid input",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "AWB number is required",
      "path": ["awbNumber"]
    }
  ]
}
```

## Testing Checklist

- [ ] All order status transitions work correctly
- [ ] Invalid transitions return 409 status
- [ ] AWB creation works (with mock provider)
- [ ] AWB label can be downloaded
- [ ] Webhook is idempotent (duplicate events handled)
- [ ] Delivered webhook transitions order to delivered
- [ ] Messaging only works between buyer and seller
- [ ] Contact information is masked in messages
- [ ] All endpoints return proper HTTP status codes
- [ ] Authentication and authorization work correctly
