# Launch Checklist - Quick Reference

Use this checklist to track progress toward production launch.

## 🔴 Critical Blockers (Must Complete)

### Testing
- [ ] Unit tests for payment processing
- [ ] Unit tests for order management
- [ ] Integration tests for API endpoints
- [ ] E2E test for checkout flow (5+ successful runs)
- [ ] E2E test for payment flow
- [ ] E2E test for seller onboarding

### Monitoring & Analytics
- [x] Sentry error tracking installed and configured ✅
- [x] Sentry DSN added to environment variables ✅
- [ ] Error alerts configured (email/Slack)
- [ ] Google Analytics 4 implemented
- [ ] E-commerce tracking configured
- [ ] Vercel Analytics enabled
- [ ] Core Web Vitals tracking

### Payment Gateway
- [ ] Netopia production account obtained
- [ ] Production `NETOPIA_MERCHANT_ID` configured
- [ ] Production `NETOPIA_PRIVATE_KEY` configured
- [ ] Production `NETOPIA_PUBLIC_CERT` configured
- [ ] Webhook URL configured: `https://pots.ro/api/payments/netopia/callback`
- [ ] 1+ real transaction tested successfully

### Logging
- [x] Structured logging implemented ✅
- [x] Log levels configured (info, warn, error) ✅
- [ ] Log aggregation service configured (Vercel Logs automatic)
- [ ] Console.log removed from production code (gradual migration)

### Environment Variables
- [ ] All production env vars set in Vercel
- [ ] `DATABASE_URL` configured
- [ ] `LUCIA_SECRET` generated (strong random)
- [ ] `JWT_SECRET` generated (strong random)
- [ ] `SITE_URL` set to `https://pots.ro`
- [ ] `NODE_ENV=production`
- [ ] `RESEND_API_KEY` configured
- [ ] `EMAIL_FROM` configured and verified

## 🟡 High Priority

### Database
- [x] Daily backups configured (Vercel automatic + manual scripts) ✅
- [ ] Backup restoration tested
- [x] Connection pooling configured ✅
- [ ] Query performance verified
- [ ] All migrations tested

### Security
- [ ] Rate limiting configured for all API endpoints
- [ ] CORS configured for production domain
- [ ] Security headers verified (CSP, HSTS)
- [ ] Environment variable validation strengthened
- [ ] Security audit completed

### Email
- [ ] SPF record configured
- [ ] DKIM configured
- [ ] DMARC policy configured
- [ ] Email bounce handling implemented
- [ ] All email templates tested
- [ ] Email delivery rates verified

### SEO
- [ ] Google Search Console connected
- [ ] Google verification code added
- [ ] Sitemap submitted to Google
- [ ] Sitemap submitted to Bing
- [ ] Structured data validated (Rich Results Test)
- [ ] All pages have unique meta tags

### Performance
- [ ] Lighthouse Performance score ≥ 90
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] LCP ≤ 2.5s
- [ ] CLS ≤ 0.1
- [ ] All images optimized (WebP, < 300KB)
- [ ] Tested on real devices

## 🟢 Medium Priority

### Content
- [ ] 100-150 products created
- [ ] 10+ sellers onboarded
- [ ] Product images uploaded and optimized
- [ ] Category descriptions written
- [ ] 2-3 blog articles published

### Legal
- [ ] Terms & Conditions reviewed by lawyer
- [ ] Privacy Policy reviewed by lawyer
- [ ] Cookie Policy reviewed by lawyer
- [ ] GDPR page reviewed
- [ ] Company contact info added (phone, address)
- [ ] Cookie consent tested

### Documentation
- [ ] User onboarding guide created
- [ ] Seller onboarding guide created
- [ ] Help center articles completed
- [ ] FAQ page created
- [ ] API documentation created
- [ ] Deployment runbook created

### User Experience
- [ ] 404 page tested
- [ ] 500 page tested
- [ ] Mobile responsive verified
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility tested (keyboard navigation, screen readers)

## 📋 Pre-Launch Day

### 24 Hours Before
- [ ] Final database backup
- [ ] All environment variables verified
- [ ] Health check endpoint tested
- [ ] Monitoring dashboards verified
- [ ] Team briefed on launch plan
- [ ] Rollback procedure reviewed

### Launch Day
- [ ] DNS configured correctly
- [ ] SSL certificate verified
- [ ] First test transaction completed
- [ ] Monitoring active and verified
- [ ] Team on standby

### Post-Launch (First 24h)
- [ ] Monitor error rates (< 0.5%)
- [ ] Monitor response times (< 2s)
- [ ] Monitor payment success rate (> 95%)
- [ ] Review user registrations
- [ ] Review first orders
- [ ] Address any critical issues immediately

## ✅ Go/No-Go Decision

### Must Have (All Required)
- [ ] Error tracking working
- [ ] Analytics tracking working
- [ ] Production payment gateway tested
- [ ] Database backups configured
- [ ] At least 50 products in catalog
- [ ] At least 5 sellers onboarded
- [ ] Legal pages approved
- [ ] Basic tests passing
- [ ] Performance targets met
- [ ] Security audit passed

### Decision
- [ ] **GO** - All criteria met, ready to launch
- [ ] **NO-GO** - Critical issues remain

**Decision Date**: _______________  
**Decision Maker**: _______________  
**Launch Date**: _______________

---

**Last Updated**: 2025-01-10
