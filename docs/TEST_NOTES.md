# Test Notes - Pots.ro MVP Testing

## Overview
Notițe și instrucțiuni pentru testarea completă a platformei Pots.ro înainte de lansarea MVP.

## E2E Testing

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Install testing tools
npm install -g @lhci/cli
npm install -g artillery
```

### Test Files Location
- **E2E Tests**: `tests/e2e/`
- **Performance Tests**: `tests/perf/`
- **Lighthouse Tests**: `tests/lh/`

### Environment Variables
```bash
# Required for testing
NETOPIA_MERCHANT_ID=test_merchant
NETOPIA_PRIVATE_KEY=test_key
NETOPIA_SANDBOX=true
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

## E2E Test Scenarios

### A. Multi-seller Payment Flow
**File**: `tests/e2e/A-multi-seller-paid.http`
**Duration**: ~15 minutes
**Steps**:
1. Create multi-seller cart
2. Process payment via Netopia sandbox
3. Verify order status PAID
4. Test shipping and delivery flow
5. Verify payout creation and execution

**Expected Results**:
- [ ] Cart created with products from 2+ sellers
- [ ] Payment processed successfully
- [ ] Order status: PAID
- [ ] Stock decreased for all products
- [ ] Invoice generated
- [ ] AWB created
- [ ] Status: SHIPPED → DELIVERED
- [ ] Payout created and executed
- [ ] Ledger entries: CHARGE, COMMISSION, PAYOUT

### B. Payment Fail & Retry
**File**: `tests/e2e/B-payment-fail-retry.http`
**Duration**: ~10 minutes
**Steps**:
1. Create order
2. Simulate payment failure
3. Verify order status PENDING
4. Verify cart restored
5. Retry payment successfully
6. Test idempotent callback

**Expected Results**:
- [ ] Payment failure → status PENDING
- [ ] Cart restored after failure
- [ ] Stock unchanged after failure
- [ ] Retry success → status PAID
- [ ] Stock decreased after retry
- [ ] Cart empty after retry
- [ ] Idempotent callback (no duplicates)

### C. Total Refund Pre-Payout
**File**: `tests/e2e/C-refund-total-pre-payout.http`
**Duration**: ~8 minutes
**Steps**:
1. Create refund request
2. Admin approval
3. Process refund via Netopia
4. Verify order status REFUNDED
5. Verify stock restored

**Expected Results**:
- [ ] Refund request created
- [ ] Admin approval successful
- [ ] Refund processed
- [ ] Order status: REFUNDED
- [ ] Stock restored
- [ ] Money returned to buyer
- [ ] No payout created
- [ ] Ledger entry: REFUND

### D. Partial Refund Post-Payout
**File**: `tests/e2e/D-refund-partial-post-payout.http`
**Duration**: ~10 minutes
**Steps**:
1. Verify payout already executed
2. Create partial refund request
3. Admin approval
4. Process refund
5. Verify RECOVERY ledger entry

**Expected Results**:
- [ ] Payout already PAID
- [ ] Partial refund created
- [ ] Admin approval successful
- [ ] Refund processed
- [ ] Order status: PARTIALLY_REFUNDED
- [ ] Partial stock restored
- [ ] Money returned to buyer
- [ ] RECOVERY ledger entry (negative seller, positive platform)

### E. Return Flow
**File**: `tests/e2e/E-return-flow.http`
**Duration**: ~12 minutes
**Steps**:
1. Buyer initiates return request
2. Seller approval
3. Buyer ships product back
4. Seller confirms receipt
5. Admin finalizes return
6. Verify automatic refund

**Expected Results**:
- [ ] Return request created
- [ ] Seller approval successful
- [ ] Product shipped back
- [ ] Seller confirms receipt
- [ ] Admin finalizes return
- [ ] Automatic refund created
- [ ] Order status: RETURNED
- [ ] Stock restored
- [ ] Emails sent at each step

### F. Anti-bypass Messaging
**File**: `tests/e2e/F-anti-bypass.http`
**Duration**: ~8 minutes
**Steps**:
1. Test email blocking
2. Test phone blocking
3. Test masked contact blocking
4. Test valid message sending
5. Verify UI masking

**Expected Results**:
- [ ] Email addresses blocked
- [ ] Phone numbers blocked
- [ ] Masked contacts blocked
- [ ] Valid messages sent
- [ ] UI masking functional
- [ ] Tooltips and warnings visible
- [ ] Send button disabled for patterns

### RLS Security Smoke Test
**File**: `tests/e2e/rls-smoke.http`
**Duration**: ~15 minutes
**Steps**:
1. Test with 3 different tokens
2. Verify access restrictions
3. Test unauthorized access
4. Verify 403 responses

**Expected Results**:
- [ ] Buyer sees only own orders
- [ ] Seller sees only own products/orders
- [ ] Admin sees all data
- [ ] Unauthorized access → 403
- [ ] RLS policies active
- [ ] Middleware auth functional

## Performance Testing

### Artillery Search Load Test
**File**: `tests/perf/artillery-search.yml`
**Command**:
```bash
artillery run tests/perf/artillery-search.yml
```

**Targets**:
- **Load**: 25 req/s for 60 seconds
- **Endpoints**: `/api/search`, `/api/products`, `/api/categories`
- **Acceptance**: No 5xx errors, p95 < 800ms

**Expected Results**:
- [ ] No 5xx errors
- [ ] p95 response time < 800ms
- [ ] p99 response time < 1200ms
- [ ] Average response time < 400ms
- [ ] Error rate < 0.1%

### Artillery Checkout Load Test
**File**: `tests/perf/artillery-checkout.yml`
**Command**:
```bash
artillery run tests/perf/artillery-checkout.yml
```

**Targets**:
- **Load**: 5 simultaneous checkouts
- **Duration**: 30 seconds
- **Flow**: Login → Add to cart → Create order → Payment

**Expected Results**:
- [ ] No 5xx errors
- [ ] All checkouts complete successfully
- [ ] Payment processing < 5s
- [ ] Order creation < 2s
- [ ] Cart operations < 1s

## Lighthouse Testing

### Setup
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run tests
lhci autorun --config=tests/lh/lhci.config.cjs
```

### Targets
- **Performance**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90
- **LCP**: ≤ 2.5s
- **CLS**: ≤ 0.1

### URLs to Test
**File**: `tests/lh/urls.txt`
- Homepage
- Category pages
- Product pages
- Checkout flow
- Seller dashboard
- Admin dashboard
- Legal pages

**Expected Results**:
- [ ] Performance score ≥ 90
- [ ] Accessibility score ≥ 95
- [ ] Best practices score ≥ 90
- [ ] SEO score ≥ 90
- [ ] LCP ≤ 2.5s
- [ ] CLS ≤ 0.1
- [ ] FCP ≤ 2s
- [ ] TBT ≤ 300ms

## Manual Testing Checklist

### Mobile Responsiveness
- [ ] **iPhone SE**: All pages functional
- [ ] **iPhone 12**: All pages functional
- [ ] **Samsung Galaxy**: All pages functional
- [ ] **iPad**: All pages functional
- [ ] **Android Tablet**: All pages functional

### Cross-Browser Testing
- [ ] **Chrome**: Latest version
- [ ] **Firefox**: Latest version
- [ ] **Safari**: Latest version
- [ ] **Edge**: Latest version
- [ ] **Mobile Safari**: iOS
- [ ] **Chrome Mobile**: Android

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab, Enter, Space
- [ ] **Screen Reader**: NVDA, JAWS, VoiceOver
- [ ] **Color Contrast**: 4.5:1 minimum
- [ ] **Focus Indicators**: Visible and clear
- [ ] **Skip Links**: Functional
- [ ] **Alt Text**: All images have alt text

### User Flows
- [ ] **Buyer Registration**: Complete flow
- [ ] **Seller Onboarding**: Complete flow
- [ ] **Product Search**: Find and filter
- [ ] **Add to Cart**: Multi-seller cart
- [ ] **Checkout**: Complete payment
- [ ] **Order Tracking**: Status updates
- [ ] **Refund Request**: Complete flow
- [ ] **Return Request**: Complete flow

## Bug Triage

### P0 (Critical) - Fix Immediately
- Payment failures
- Data loss
- Security vulnerabilities
- RLS bypass
- Performance issues

### P1 (High) - Fix < 24h
- UX issues with workaround
- Email delivery failures
- Image loading issues
- Search functionality problems

### P2 (Medium) - Backlog
- Visual inconsistencies
- Minor performance issues
- Non-critical features
- Enhancement requests

### P3 (Low) - Future
- Nice-to-have features
- UI polish
- Documentation updates
- Code refactoring

## Test Execution Plan

### Phase 1: Automated Tests (Day 1)
- [ ] Run all E2E tests
- [ ] Run performance tests
- [ ] Run Lighthouse tests
- [ ] Document results
- [ ] Triage bugs

### Phase 2: Manual Testing (Day 2)
- [ ] Mobile responsiveness
- [ ] Cross-browser testing
- [ ] Accessibility testing
- [ ] User flow testing
- [ ] Document issues

### Phase 3: Integration Testing (Day 3)
- [ ] Payment gateway integration
- [ ] Email system integration
- [ ] Storage system integration
- [ ] Database performance
- [ ] API integration

### Phase 4: Load Testing (Day 4)
- [ ] High load scenarios
- [ ] Stress testing
- [ ] Endurance testing
- [ ] Performance optimization
- [ ] Capacity planning

### Phase 5: Security Testing (Day 5)
- [ ] RLS policy testing
- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Input validation testing
- [ ] SQL injection testing

## Go/No-Go Criteria

### GO Criteria (All Must Pass)
- [ ] E2E tests: 5/5 scenarios pass
- [ ] Performance: p95 < 800ms
- [ ] Lighthouse: Perf ≥ 90, A11y ≥ 95
- [ ] RLS: All unauthorized access blocked
- [ ] Payments: 5/5 sandbox transactions pass
- [ ] Mobile: All critical flows functional
- [ ] Cross-browser: All major browsers supported
- [ ] Accessibility: Full keyboard navigation

### NO-GO Criteria (Any Fails)
- [ ] Payment failures > 5%
- [ ] Performance issues
- [ ] Security vulnerabilities
- [ ] Data loss risk
- [ ] Mobile usability issues
- [ ] Accessibility failures
- [ ] RLS bypass possible
- [ ] Critical bugs unresolved

## Test Reporting

### Daily Reports
- **Test Execution**: What was tested
- **Results**: Pass/fail status
- **Issues**: Bugs found and severity
- **Progress**: Completion percentage
- **Blockers**: Issues preventing progress

### Final Report
- **Executive Summary**: Overall status
- **Test Results**: Detailed results
- **Bug Summary**: All issues found
- **Recommendations**: Go/No-Go decision
- **Next Steps**: Action items

## Tools and Resources

### Testing Tools
- **E2E**: Thunder Client (VSCode extension)
- **Performance**: Artillery
- **Lighthouse**: Lighthouse CI
- **Mobile**: Browser DevTools
- **Accessibility**: WAVE, axe-core

### Monitoring Tools
- **Performance**: Vercel Analytics
- **Errors**: Vercel Logs
- **Database**: Supabase Dashboard
- **Uptime**: UptimeRobot
- **Analytics**: Google Analytics

### Documentation
- **Test Plans**: This document
- **Bug Reports**: GitHub Issues
- **API Docs**: OpenAPI/Swagger
- **User Guides**: README files
- **Deployment**: Vercel Dashboard

## Contact Information

### Test Team
- **QA Lead**: [Name] - [Email]
- **Automation**: [Name] - [Email]
- **Performance**: [Name] - [Email]
- **Security**: [Name] - [Email]

### Development Team
- **Tech Lead**: [Name] - [Email]
- **Backend**: [Name] - [Email]
- **Frontend**: [Name] - [Email]
- **DevOps**: [Name] - [Email]

### External Dependencies
- **Netopia**: [Contact]
- **Supabase**: [Contact]
- **Vercel**: [Contact]
- **Resend**: [Contact]

---
**Test Notes Version**: 1.0
**Last Updated**: 2025-01-10
**Next Review**: 2025-01-15
