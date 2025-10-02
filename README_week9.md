# Week 9 - MVP Implementation

## Overview
Week 9 implementează funcționalități esențiale pentru MVP: import CSV produse, SEO ofensiv, blog și unelte admin.

## Features Implementate

### 🔹 Backend (CSV import + SEO infra)

#### 1. API Import produse CSV
- **Endpoint**: `POST /api/seller/products/import`
- **Funcționalitate**: Upload CSV, validare, preview, import cu imagini
- **Format CSV**: `title, description, price, stock, category_slug, image_url`
- **Storage**: Imagini descărcate și stocate în Supabase Storage
- **Status**: Produsele sunt salvate ca `DRAFT`

#### 2. Sitemaps dinamice
- **Rute**: 
  - `/sitemaps/products.xml`
  - `/sitemaps/sellers.xml` 
  - `/sitemaps/categories.xml`
- **Cache**: 15 minute
- **Regenerare**: Cron zilnic la 2:00 AM
- **Priority**: 0.8 pentru active, 0.6 pentru draft

#### 3. SEO micro-landinguri categorii
- **Rute**: `/c/[category]/[attribute]` (ex: `/c/ghivece/ceramica-alba`)
- **Funcționalitate**: Pagini automate cu filtre pre-aplicate
- **SEO**: Meta tags dinamice, breadcrumbs, conținut optimizat

#### 4. Meta dinamice & canonical
- **Produse**: `${title} | ${seller.brandName} | Pots.ro`
- **Categorii**: `${categoryName} la prețuri românești – Pots.ro`
- **OG Tags**: Complete cu imagini și descrieri
- **Twitter Cards**: Summary large image

### 🔹 Frontend (CSV UI + SEO polish + blog)

#### 5. UI Upload CSV (Seller Dashboard)
- **Component**: `CsvImportDialog`
- **Funcționalitate**: Drag & drop, preview tabel, validare, import
- **Preview**: Primele 10 rânduri cu validare și erori
- **Feedback**: Toast notifications, progress bar

#### 6. UI categorii & micro-landinguri
- **Breadcrumbs**: Extinse pentru subcategorii
- **Filtre**: Pre-aplicate vizibile
- **SEO**: Titluri friendly, conținut optimizat

#### 7. SEO UI polishing
- **Lazy loading**: Imagini secundare
- **OG tags**: Complete și corecte
- **Social sharing**: Imagine + titlu

#### 8. Blog setup
- **Pagini**: `/blog` + `/blog/[slug]`
- **ISR**: Regenerare la cerere
- **Editor**: Markdown simplu
- **Sitemap**: Indexat automat

#### 9. UI SEO tools pentru admin
- **Component**: `SeoToolsTab`
- **Funcționalitate**: Listă produse fără descriere/imagini
- **Notificări**: Posibilitate de notificare seller
- **Severitate**: High, medium, low

## Format CSV

```csv
title,description,price,stock,category_slug,image_url
"Ghiveci ceramic alb","Ghiveci din ceramică naturală, perfect pentru plante de interior",49.90,15,ghivece,https://example.com/image1.jpg
"Planta monstera","Planta tropicală cu frunze mari, ideală pentru living",89.50,8,plante,https://example.com/image2.jpg
```

## DTOs

```typescript
type ImportPreviewRow = {
  line: number;
  valid: boolean;
  errors: string[];
  data?: {
    title: string;
    description: string;
    price: number;
    stock: number;
    category_slug: string;
    image_url: string;
  };
};

type ImportResult = {
  successCount: number;
  errorCount: number;
  draftIds: string[];
};
```

## Test Steps

### 1. CSV Import
1. Accesează `/seller/products`
2. Click "Import CSV"
3. Upload fișier CSV cu 50+ produse
4. Verifică preview-ul
5. Confirmă importul
6. Verifică că produsele apar ca draft

### 2. Sitemaps
1. Accesează `/sitemaps/products.xml`
2. Verifică că conține produsele active
3. Accesează `/sitemaps/sellers.xml`
4. Verifică că conține vânzătorii
5. Accesează `/sitemaps/categories.xml`
6. Verifică că conține categoriile

### 3. SEO Micro-landinguri
1. Accesează `/c/ghivece/ceramica-alba`
2. Verifică că pagina se încarcă corect
3. Verifică breadcrumbs
4. Verifică filtrele pre-aplicate
5. Verifică conținutul SEO

### 4. Meta Tags
1. Accesează o pagină de produs
2. Verifică title-ul în browser
3. Verifică OG tags cu Facebook Debugger
4. Verifică Twitter cards
5. Verifică canonical URL

### 5. Blog
1. Accesează `/blog`
2. Verifică lista de articole
3. Accesează un articol
4. Verifică conținutul markdown
5. Verifică meta tags

### 6. SEO Tools Admin
1. Accesează `/admin/finante`
2. Click tab "SEO Tools"
3. Verifică lista produselor cu probleme
4. Selectează produse
5. Testează notificarea vânzătorilor

## Google Search Console

### Sitemap URLs
- `https://pots.ro/sitemaps/products.xml`
- `https://pots.ro/sitemaps/sellers.xml`
- `https://pots.ro/sitemaps/categories.xml`

### Testare
1. Adaugă sitemap-urile în GSC
2. Verifică că sunt validate fără erori
3. Monitorizează indexarea
4. Verifică coverage-ul

## Cron Jobs

### Regenerare Sitemaps
- **Schedule**: `0 2 * * *` (zilnic la 2:00 AM)
- **Endpoint**: `/api/cron/regenerate-sitemaps`
- **Funcționalitate**: Regenerează toate sitemap-urile

## Dependencies

### Noi dependențe
- `react-dropzone` - pentru upload CSV
- `@radix-ui/react-progress` - pentru progress bar
- `@radix-ui/react-tabs` - pentru tabs
- `@radix-ui/react-alert` - pentru alert-uri

### Instalare
```bash
npm install react-dropzone @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-alert
```

## Environment Variables

```env
# Supabase pentru storage imagini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cron secret pentru regenerare sitemaps
CRON_SECRET=your_cron_secret

# App URL pentru cron jobs
NEXT_PUBLIC_APP_URL=https://pots.ro
```

## Performance

### Optimizări SEO
- Lazy loading pentru imagini
- Meta tags dinamice
- Sitemaps cu cache
- Canonical URLs

### Optimizări CSV
- Preview limitat la 10 rânduri
- Validare pe client și server
- Progress feedback
- Error handling robust

## Security

### CSV Upload
- Validare tip fișier
- Limitare dimensiune
- Sanitizare conținut
- Rate limiting

### Sitemaps
- Cache headers
- Error handling
- Rate limiting

## Monitoring

### Logs
- CSV import success/error
- Sitemap regeneration
- SEO tools usage
- Blog page views

### Metrics
- Import success rate
- Sitemap validation
- SEO score improvements
- Blog engagement

## Next Steps

1. **Testing**: Testează toate funcționalitățile
2. **GSC**: Adaugă sitemap-urile în Google Search Console
3. **Monitoring**: Monitorizează performanța SEO
4. **Content**: Adaugă conținut blog
5. **Optimization**: Optimizează bazat pe datele de utilizare
