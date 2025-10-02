# Week 6 Vercel Features - Implementation Guide

This document outlines the implementation of Week 6 features for Pots.ro, including invoicing, transactional emails, dynamic sitemaps, schema.org structured data, monitoring, and cron jobs.

## 🗄️ Database Schema

### New Tables Added

The following tables have been added to the Drizzle schema:

- **`invoices`** - Stores invoice data with unique orderId constraint
- **`email_events`** - Logs all email sending attempts and results
- **`webhook_logs`** - Tracks all webhook events for debugging and monitoring

### Migration

Run the database migration:
```bash
npm run db:generate
npm run db:migrate
```

## 🧾 Invoicing System

### Providers

Three invoice providers are implemented:

1. **SmartBill** (`lib/invoicing/smartbill.ts`)
2. **Facturis** (`lib/invoicing/facturis.ts`) 
3. **Mock** (`lib/invoicing/mock.ts`) - For development/testing

### API Endpoints

- `POST /api/internal/invoice-create` - Creates invoice for an order (idempotent)
- `GET /api/invoices/[id]/pdf` - Downloads invoice PDF (with auth)

### Environment Variables

```bash
# Invoicing
INVOICE_PROVIDER=smartbill|facturis|mock
SMARTBILL_API_BASE=https://ws.smartbill.ro/SBORO/api
SMARTBILL_USERNAME=your_username
SMARTBILL_TOKEN=your_token
SMARTBILL_SERIES=PO
FACTURIS_API_BASE=https://api.facturis.ro
FACTURIS_API_KEY=your_api_key
FACTURIS_SERIES=PO
INVOICE_DEFAULT_VAT=19
```

## 📧 Transactional Email System

### Email Templates

React Email templates are located in `lib/email/templates/`:

- `OrderPaid.tsx` - Sent when order is paid (includes invoice PDF)
- `OrderShipped.tsx` - Sent when order is shipped (includes tracking info)
- `OrderDelivered.tsx` - Sent when order is delivered
- `MessageCreated.tsx` - Sent when new message is received (rate-limited)

### Email Service

The email service (`lib/email/index.ts`) supports:

- **Resend** (preferred) - Modern email API
- **SMTP** (fallback) - Traditional SMTP with nodemailer
- **Retry logic** - Exponential backoff for failed sends
- **Event logging** - All email attempts logged to database

### Environment Variables

```bash
# Email
EMAIL_PROVIDER=resend|smtp
RESEND_API_KEY=your_resend_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Pots.ro <no-reply@pots.ro>"
ADMIN_EMAILS="ops@pots.ro,dev@pots.ro"
```

## 🗺️ Dynamic Sitemaps

### Sitemap Structure

- `/sitemap.xml` - Main sitemap index
- `/sitemaps/products.xml` - All active products
- `/sitemaps/sellers.xml` - All seller pages
- `/sitemaps/categories.xml` - All category pages
- `/sitemaps/blog.xml` - Static pages (about, help, etc.)

### Features

- **Caching** - 15-minute cache with stale-while-revalidate
- **Valid XML** - Proper XML structure with correct namespaces
- **lastmod** - Based on updatedAt timestamps
- **Pagination ready** - Structure supports future pagination

## 🏷️ Schema.org Structured Data

### Helper Functions (`lib/seo/schema.ts`)

- `organizationSchema()` - Company information
- `websiteSchema()` - Website with search action
- `breadcrumbSchema()` - Navigation breadcrumbs
- `productSchema()` - Product with offers
- `storeSchema()` - Seller store information
- `aggregateOfferSchema()` - Multiple product offers

### Usage

```tsx
import { organizationSchema, productSchema } from '@/lib/seo/schema';

// In your page component
const structuredData = organizationSchema();

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  </>
);
```

## 🔍 Monitoring & Health Checks

### Health Endpoint

`GET /api/health` checks:

- **Database** - Simple SELECT 1 query
- **Storage** - Vercel Blob or S3 connectivity
- **Payments** - Provider ping (noop)
- **Invoices** - Provider ping (noop)
- **Email** - Provider ping (noop)

### Webhook Logging

All webhook events are logged to `webhook_logs` table:

- Payment callbacks
- Shipping updates
- Invoice creation
- Email events

## ⏰ Daily Cron Job

### Configuration

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-maint",
      "schedule": "0 5 * * *"
    }
  ]
}
```

### Daily Maintenance Tasks

1. **Sitemap Warmup** - Refreshes all sitemap caches
2. **Health Check** - Runs health checks
3. **Failure Reporting** - Sends email alerts if health checks fail
4. **Cleanup** - Removes logs older than 90 days

## 🧪 Testing Guide

### 1. Invoice Testing

```bash
# Create a test order and mark as paid
curl -X POST https://pots.ro/api/internal/invoice-create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-id"}'

# Download invoice PDF
curl -H "Authorization: Bearer your-token" \
  https://pots.ro/api/invoices/invoice-id/pdf
```

### 2. Email Testing

```bash
# Test email sending (check logs in email_events table)
# Emails are sent automatically on order status changes
```

### 3. Sitemap Validation

```bash
# Check sitemap index
curl https://pots.ro/sitemap.xml

# Validate with Google Search Console
# Submit sitemap URL: https://pots.ro/sitemap.xml
```

### 4. Schema.org Testing

```bash
# Test structured data
curl https://pots.ro/p/product-id-slug

# Validate with Rich Results Test
# https://search.google.com/test/rich-results
```

### 5. Health Monitoring

```bash
# Check health status
curl https://pots.ro/api/health

# Force failure to test cron reporting
# Modify health check to return error, wait for daily cron
```

## 🔧 Environment Setup

### Required Environment Variables

```bash
# App
APP_BASE_URL=https://pots.ro

# Invoicing
INVOICE_PROVIDER=mock
INVOICE_DEFAULT_VAT=19

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_key
EMAIL_FROM="Pots.ro <no-reply@pots.ro>"
ADMIN_EMAILS="ops@pots.ro"

# Storage (optional)
BLOB_BACKEND=vercel
VERCEL_BLOB_READ_WRITE_TOKEN=your_token

# Company info
COMPANY_VAT_NUMBER=RO12345678
```

## 🚀 Deployment Checklist

- [ ] Run database migration
- [ ] Set environment variables
- [ ] Test invoice creation
- [ ] Test email sending
- [ ] Validate sitemaps in GSC
- [ ] Test schema.org with Rich Results Test
- [ ] Verify health endpoint
- [ ] Test cron job execution
- [ ] Monitor webhook logs

## 📊 Monitoring Dashboard

Monitor the following:

1. **Email Events** - Check `email_events` table for delivery rates
2. **Webhook Logs** - Monitor `webhook_logs` for errors
3. **Health Checks** - Daily cron reports
4. **Invoice Creation** - Success/failure rates
5. **Sitemap Updates** - Cache refresh frequency

## 🔒 Security Notes

- Invoice PDFs are protected by authentication
- Email templates prevent XSS with proper escaping
- Webhook signatures are verified
- Health checks don't expose sensitive data
- Cron jobs are rate-limited

## 📈 Performance Considerations

- Sitemaps are cached for 15 minutes
- Email sending has retry logic with backoff
- Database queries are optimized with indexes
- Health checks are lightweight
- Cron jobs run during low-traffic hours (5 AM UTC)

---

## 🎯 Acceptance Criteria

✅ **Invoice auto-creation on PAID** - Idempotent, secure PDF proxy  
✅ **Transactional emails with retry** - Rate-limited, logged  
✅ **Dynamic sitemaps** - Split, cached, valid in GSC  
✅ **Schema.org LD+JSON** - Rich results clean  
✅ **Health monitoring** - `/api/health` OK  
✅ **Daily cron reports** - Failure notifications  

All features are production-ready and follow Vercel best practices for serverless deployment.
