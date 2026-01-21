# Week 10 - MVP: Promoții, Analytics, Cron Consolidat

## Overview
Week 10 implementează sistemul de promoții, analytics intern și consolidarea cron job-urilor pentru a respecta limita Vercel de 2 cron jobs.

## Features Implementate

### 1. Sistem Promoții (fără vouchere)
- **Tabele**: `promotions` cu tipuri `banner` și `discount`
- **API Endpoints**:
  - `GET /api/promotions/active` - Banner activ pentru pagină
  - `GET /api/promotions` - Lista promoțiilor seller
  - `POST /api/promotions` - Creare promoție
  - `PATCH /api/promotions/[id]` - Activare/dezactivare
  - `DELETE /api/promotions/[id]` - Ștergere promoție

### 2. Aplicare Automată Reduceri
- **Checkout extins**: `POST /api/checkout/create-order` aplică reducerile automat
- **Logica reducerilor**:
  - Procent: `price * percent/100` per item
  - Valoare fixă: aplicată proporțional per item
  - Targeting: global, seller, categorie, produs
- **Persistență**: `orders.total_discount_cents`, `order_items.discount_cents`

### 3. Analytics Intern
- **Event tracking**:
  - `POST /api/events/product-view`
  - `POST /api/events/cart-add`
  - `POST /api/events/order-placed`
- **Agregare zilnică**: Cron `daily-maint` agregă evenimentele
- **Tabele**: `seller_stats_daily`, `product_stats_daily`, `events_raw`

### 4. Cron Jobs Consolidate
- **Limită Vercel**: Maxim 2 cron jobs
- **Cron #1**: `/api/cron/ship-to-delivered` (unchanged)
- **Cron #2**: `/api/cron/daily-maint` (consolidat):
  - Regenerare sitemaps
  - Agregare analytics
  - Curățare logs vechi
  - Health check

### 5. UI Components

#### Promoționale
- `PromotionalBanner` - Banner activ pe homepage și categorii
- `PromotionForm` - Formular creare promoții
- `PromotionList` - Lista și gestionarea promoțiilor

#### Analytics
- `SellerAnalytics` - Dashboard statistici vânzător
- `AdminAnalytics` - Dashboard statistici marketplace
- Metrice: views, add-to-cart, orders, revenue, bounce rate

#### Checkout
- `OrderSummary` extins cu afișare reduceri
- Linie verde pentru reducere aplicată

## API Endpoints

### Promoții
```typescript
// Banner activ
GET /api/promotions/active?category=ghivece&sellerId=uuid

// Gestionare promoții
GET /api/promotions
POST /api/promotions
PATCH /api/promotions/[id]
DELETE /api/promotions/[id]
```

### Analytics
```typescript
// Event tracking
POST /api/events/product-view
POST /api/events/cart-add
POST /api/events/order-placed

// Rapoarte
GET /api/analytics/seller/[id]?range=30d
GET /api/analytics/admin?range=30d
```

### Checkout (extins)
```typescript
POST /api/checkout/create-order
// Response includes:
{
  discount: {
    applied: boolean,
    total_ron: number
  },
  totals: {
    total_discount_cents: number
  }
}
```

## Tipuri de Date

### Promotion
```typescript
type Promotion = {
  id: string;
  title: string;
  type: 'banner' | 'discount';
  percent?: number; // 0-100
  value?: number; // RON in cents
  active: boolean;
  startAt: string;
  endAt: string;
  sellerId?: string;
  targetCategorySlug?: string;
  targetProductId?: string;
};
```

### Analytics Response
```typescript
type SellerAnalyticsResponse = {
  range: string;
  series: SellerStatsDaily[];
  topProducts: Array<{ productId: string; name: string; revenue: number }>;
  bounce: { views: number; addToCart: number };
};
```

## Database Schema

### Tabele noi
- `promotions` - Promoții și reduceri
- `seller_stats_daily` - Statistici zilnice vânzători
- `product_stats_daily` - Statistici zilnice produse
- `events_raw` - Evenimente brute pentru audit

### Modificări existente
- `orders.total_discount_cents` - Reducere totală comandă
- `order_items.discount_cents` - Reducere per item

## Cron Jobs

### vercel.json
```json
{
  "crons": [
    { "path": "/api/cron/ship-to-delivered", "schedule": "0 6 * * *" },
    { "path": "/api/cron/daily-maint", "schedule": "0 5 * * *" }
  ]
}
```

### Daily Maintenance Tasks
1. **Sitemap regeneration** - Warm up cache
2. **Analytics aggregation** - Agregare evenimente zilnice
3. **Log cleanup** - Curățare logs >90 zile
4. **Health check** - Verificare sistem

## Test Steps

### 1. Promoții
```bash
# Creează promoție discount
curl -X POST /api/promotions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Reducere 20% ghivece",
    "type": "discount",
    "percent": 20,
    "startAt": "2024-01-01T00:00:00Z",
    "endAt": "2024-12-31T23:59:59Z",
    "targetCategorySlug": "ghivece"
  }'

# Verifică banner activ
curl /api/promotions/active?category=ghivece
```

### 2. Analytics
```bash
# Track product view
curl -X POST /api/events/product-view \
  -H "Content-Type: application/json" \
  -d '{"productId": "uuid", "sellerId": "uuid"}'

# Verifică statistici
curl /api/analytics/seller/uuid?range=30d
curl /api/analytics/admin?range=30d
```

### 3. Checkout cu reduceri
```bash
# Creează comandă (reducerile se aplică automat)
curl -X POST /api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{"shippingChoice": {"carrier": "Cargus", "service": "Standard", "fee_cents": 1999}}'
```

### 4. UI Testing
- Homepage: Banner promoțional afișat
- Categorie: Banner țintit pe categorie
- Seller Dashboard: Formular promoții + listă
- Analytics: Grafice și metrici
- Checkout: Linie reducere verde

## Acceptance Criteria

### ✅ Promoții
- [x] Banner activ pe homepage și categorii
- [x] Reducerile se aplică automat în checkout
- [x] Seller poate crea/gestiona promoții
- [x] Targeting: global, seller, categorie, produs

### ✅ Analytics
- [x] Event tracking: product-view, cart-add, order-placed
- [x] Agregare zilnică automată
- [x] Dashboard seller: views, add-to-cart, orders, revenue
- [x] Dashboard admin: overview marketplace
- [x] Top produse și vânzători

### ✅ Cron Jobs
- [x] Maxim 2 cron jobs (limită Vercel)
- [x] Consolidare daily-maint
- [x] Regenerare sitemaps
- [x] Agregare analytics
- [x] Curățare logs

### ✅ UI/UX
- [x] Banner promoțional clicabil
- [x] Formular promoții seller
- [x] Dashboard analytics cu grafice
- [x] Checkout cu afișare reduceri
- [x] Responsive design

## Performance
- **Lighthouse SEO/Perf**: ≥ 90
- **Banner loading**: < 200ms
- **Analytics aggregation**: < 30s
- **Checkout discount calculation**: < 100ms

## Dependencies
- `date-fns` - Formatare date
- `sonner` - Toast notifications
- `lucide-react` - Icons

## Notes
- **MVP focus**: Fără vouchere, sistem simplu
- **Analytics intern**: Nu înlocuiește Vercel Analytics
- **Cron limit**: Respectă limita Vercel de 2 jobs
- **Romanian only**: Toate textele în română
- **Type safety**: TypeScript strict
