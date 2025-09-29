# Pots.ro - Marketplace Românesc pentru Floristică

Un marketplace modern și complet pentru produse de floristică - cutii, ghivece, accesorii - construit cu Next.js 14, TypeScript și Tailwind CSS.

## 🚀 Caracteristici Principale

### 🛒 E-commerce Complet
- **Coș de cumpărături** cu API backend și persistare cookie
- **Checkout multi-pas** cu validare formular
- **Mini-cart** în header cu controale cantitate
- **Gestionare stoc** cu badge-uri (în stoc/limitat/epuizat)
- **Pagini produse** cu carousel imagini și specificații

### 🏪 Dashboard Vânzător
- **Gestionare produse** (CRUD complet)
- **Editor Markdown** pentru pagina "Despre" cu preview live
- **Upload imagini** cu drag & drop și reordonare
- **Publicare/retragere** produse cu ISR revalidation
- **Statistici** și analiză vânzări

### 🎨 UI/UX Modern
- **Design system** consistent cu culori brand
- **Dark mode** complet funcțional
- **Responsive design** mobile-first
- **Animații** fluide cu Framer Motion
- **Accesibilitate** completă (Lighthouse ≥ 90)

### 🔍 Funcționalități Avansate
- **Căutare** cu command palette (⌘K)
- **Filtre** funcționale (preț, culoare, material, stoc)
- **Paginare** cursor-based pentru performanță
- **ISR** (Incremental Static Regeneration)
- **SEO** optimizat cu LD+JSON și metadata

## 🛠 Tehnologii

- **Framework**: Next.js 14 cu App Router
- **Limbaj**: TypeScript pentru type safety
- **Styling**: Tailwind CSS cu design system custom
- **UI Components**: Radix UI pentru accesibilitate
- **State Management**: SWR pentru data fetching
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase (configurat pentru producție)

## 📁 Structura Proiectului

```
├── app/                          # App Router (Next.js 14)
│   ├── api/                     # API Routes
│   │   ├── cart/                # Coș de cumpărături
│   │   ├── categories/          # Categorii produse
│   │   ├── products/            # Produse
│   │   ├── sellers/             # Vânzători
│   │   └── upload-url/          # Upload imagini
│   ├── c/[slug]/                # Pagini categorii
│   ├── p/[id]-[slug]/           # Pagini produse
│   ├── s/[sellerSlug]/          # Mini-site vânzător
│   ├── dashboard/               # Dashboard vânzător
│   ├── cart/                    # Pagină coș
│   ├── checkout/                # Proces checkout
│   └── search/                  # Pagină căutare
├── components/                   # Componente reutilizabile
│   ├── ui/                      # Componente UI de bază
│   ├── cart/                    # Componente coș
│   ├── product/                 # Componente produse
│   ├── seller/                  # Componente vânzător
│   └── uploader/                # Upload imagini
├── lib/                         # Utilitare și configurații
│   ├── schemas/                 # Zod schemas
│   ├── hooks/                   # Custom hooks
│   └── types.ts                 # TypeScript types
└── scripts/                     # Scripts de testare
```

## 🚀 Instalare și Configurare

### 1. Instalare Dependențe
```bash
npm install
```

### 2. Configurare Environment
Creează fișierul `.env.local`:
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
REVALIDATE_SECRET=your_revalidate_secret

# Google
GOOGLE_VERIFICATION_CODE=your_verification_code
```

### 3. Pornire Development
```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

## 🎯 Funcționalități Implementate

### ✅ E-commerce Core
- [x] Coș de cumpărături cu API backend
- [x] Checkout multi-pas cu validare
- [x] Gestionare stoc și disponibilitate
- [x] Pagini produse cu carousel și specificații
- [x] Categorii cu filtre funcționale
- [x] Căutare avansată cu command palette

### ✅ Dashboard Vânzător
- [x] Gestionare produse (CRUD)
- [x] Upload imagini cu drag & drop
- [x] Editor Markdown pentru "Despre"
- [x] Publicare/retragere produse
- [x] Statistici și analiză

### ✅ UI/UX & Accesibilitate
- [x] Design system consistent
- [x] Dark mode complet
- [x] Responsive design mobile-first
- [x] Animații fluide
- [x] Accesibilitate completă (ARIA, keyboard navigation)
- [x] Loading states și error handling

### ✅ Performance & SEO
- [x] ISR (Incremental Static Regeneration)
- [x] Image optimization cu Next.js
- [x] LCP < 2.5s pe 4G
- [x] SEO optimizat cu LD+JSON
- [x] Metadata dinamică
- [x] Sitemap și robots.txt

### ✅ API & Backend
- [x] API RESTful complet
- [x] Validare cu Zod schemas
- [x] Error handling robust
- [x] Cache headers pentru performanță
- [x] Webhook pentru revalidation

## 🧪 Testare

### Performance Testing
```bash
npm run perf:lighthouse    # Lighthouse audit complet
npm run perf:quick         # Test rapid performanță
```

### SEO Testing
```bash
npm run test:seo           # Verificare SEO
```

### Image Testing
```bash
npm run test:images        # Verificare optimizare imagini
```

### Revalidation Testing
```bash
npm run test:revalidation  # Test ISR și cache
```

## 📊 Performance Metrics

- **Lighthouse Accessibility**: ≥ 90
- **LCP (Largest Contentful Paint)**: < 2.5s pe 4G
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

## 🎨 Design System

### Culori Brand
- **Brand**: `#0EA5E9` (albastru principal)
- **Brand Dark**: `#0369A1` (albastru închis)
- **Brand Light**: `#7DD3FC` (albastru deschis)
- **Ink**: `#0f172a` (text principal)
- **Mist**: `#f8fafc` (background deschis)

### Componente UI
- **Button**: 5 variante (primary, secondary, ghost, outline, destructive)
- **Form**: Input, Textarea, Select, Checkbox cu validare
- **Layout**: Card, Sheet, Modal, Dialog
- **Navigation**: Breadcrumbs, Pagination, Tabs
- **Feedback**: Toast, Skeleton, Empty State

## 🔧 Scripts Disponibile

```bash
# Development
npm run dev              # Pornește serverul de dezvoltare
npm run build            # Build pentru producție
npm run start            # Pornește serverul de producție

# Testing
npm run test:perf        # Test performanță
npm run test:seo         # Test SEO
npm run test:images      # Test imagini
npm run test:revalidation # Test revalidation

# Linting
npm run lint             # ESLint
npm run lint:fix         # Fix automat linting
```

## 📱 Responsive Design

- **Mobile**: < 768px (bottom sheets, touch gestures)
- **Tablet**: 768px - 1024px (adaptive layouts)
- **Desktop**: > 1024px (full features, side panels)

## 🔒 Securitate

- **Input Validation**: Zod schemas pentru toate input-urile
- **XSS Protection**: Sanitizare Markdown cu rehype-sanitize
- **CSRF Protection**: SameSite cookies
- **Content Security Policy**: Configurat în next.config.js
- **HTTPS Only**: Cookie secure flag în producție

## 🌐 SEO & Marketing

- **Structured Data**: LD+JSON pentru produse, breadcrumbs, organizație
- **Open Graph**: Metadata completă pentru social sharing
- **Sitemap**: Generat dinamic pentru toate paginile
- **Robots.txt**: Configurat pentru indexare optimă
- **Canonical URLs**: Pentru evitarea duplicate content

## 📈 Monitoring & Analytics

- **Performance Monitoring**: Client-side cu PerformanceObserver
- **Error Tracking**: Console logging pentru debugging
- **Lighthouse CI**: Integrat în workflow
- **Real User Monitoring**: Ready pentru producție

## 🚀 Deployment

### Vercel (Recomandat)
1. Conectează repository-ul la Vercel
2. Configurează environment variables
3. Deploy automat la push pe main

### Alte Platforme
- **Netlify**: Compatibil cu Next.js
- **Railway**: Pentru full-stack deployment
- **Docker**: Containerizare disponibilă

## 🤝 Contribuție

1. Fork repository-ul
2. Creează feature branch (`git checkout -b feature/nume-feature`)
3. Commit changes (`git commit -m 'feat: descriere'`)
4. Push la branch (`git push origin feature/nume-feature`)
5. Creează Pull Request

## 📄 Licență

Acest proiect este proprietate privată. Toate drepturile rezervate.

## 📞 Contact

Pentru întrebări sau suport tehnic, contactează echipa de dezvoltare.

---

**Pots.ro** - Marketplace românesc pentru floristică, construit cu ❤️ și Next.js 14.