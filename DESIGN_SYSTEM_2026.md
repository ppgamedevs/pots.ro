# FloristMarket.ro - UI Revoluționar 2026

## Design System "Simplu dar Genial"

Am implementat un design system complet revoluționar pentru FloristMarket.ro, urmând principiile "simplu dar genial" și standardele 2026.

### 🎨 Design Tokens

#### Culori
- **Primary**: `#1C6B5A` (verde smarald)
- **Ink**: `#1F2421` (text principal)
- **Muted**: `#6B6B6B` (text secundar)
- **Line**: `#ECECEC` (borders)
- **Bg**: `#FFFFFF` (background principal)
- **Bg-soft**: `#F7F4F1` (background secundar)

#### Tipografie
- **Font**: Inter (400/500/600/700)
- **Scale**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Line heights**: optimizate pentru lizibilitate

#### Spațiere
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64px
- **Raze**: sm (8px), lg (16px), full
- **Umbre**: card (0 4px 14px rgba(0,0,0,0.06)), elev (0 8px 24px rgba(0,0,0,0.08))

### 🏗️ Arhitectura Componentelor

#### SiteHeader (Modular)
- `TopBar` - Bară super slim cu informații de încredere
- `MainBar` - Header principal cu logo, search, acțiuni
- `Search` - Căutare cu autosuggest și debouncing
- `MegaMenu` - Meniu categorii cu 3 coloane + promo
- `MiniCart` - Coș mini cu hover

#### SiteFooter (Complet)
- 4 coloane: Companie | Ajutor | Legal | Utile
- Bară trust (metode plată, curieri)
- Newsletter minimal
- Linkuri ANPC/SOL și social

#### Componente Promo (Modulare)
- `PromoHero` - Slot A (Hero principal)
- `PromoCard` - Slot B/C/D/E (carduri promo)
- `UspRow` - Puncte forte (4 USP-uri)
- `CategoryTiles` - 3 tile-uri categorii principale
- `EditorialTeasers` - 3 articole blog

#### ProductCard v2 (Minimalist)
- Design curat cu badge-uri discrete
- Prețuri clare cu reduceri
- Buton "Adaugă în coș" integrat
- Hover states subtile

### 🏠 Homepage Layout (Sloturi Modulare)

Ordinea secțiunilor:
1. **Hero** (Slot A) - 16:9 desktop / 4:5 mobile
2. **USPs Row** - 4 puncte forte
3. **Grid Promo** (Slot B/C/D) - 1×2 layout
4. **Categorii principale** - 3 tile-uri mari
5. **Produse recomandate** - grilă 4×N
6. **Editorial/Blog** - 3 articole scurte
7. **Banner partener** (Slot E) - 12 coloane full

### 🔍 Search ca la eMAG (dar Aerisit)

- Input mare (56px), colțuri 12px
- Sugestii: "Căutări populare", "Ultimele căutate", "Categorii"
- Debouncing 200ms pentru performanță
- Prefetch la hover pe sugestii

### ⚡ Performanță & Accesibilitate

#### Micro-interacțiuni
- Fade/slide 120–180ms pe hover/enter
- Fără animații grele
- Transition-micro class pentru consistență

#### Accesibilitate
- Heading structure corect (un singur H1)
- aria-label la search, coș, cont
- Focus states accesibile
- Contrast AA pentru text pe imagini

#### Performanță
- LCP sub 2s: Hero image priority
- Rezervăm înălțimea pentru imagini (evităm CLS)
- Lazy-load pentru tot ce e sub fold
- Prefetch pentru linkurile către categorii

### 🔧 API Endpoints (MVP)

- `GET /api/promotions/home` - Structura sloturilor
- `GET /api/categories/top` - 3–6 categorii
- `GET /api/products/featured` - 8–12 produse
- `GET /api/blog/teasers` - 3 postări

### 📈 SEO & Metadata

#### Metadata
- Titlu: "FloristMarket – Marketplace de floristică: flori, ambalaje, cutii, accesorii"
- Canonical /
- OG/Twitter minimal (1200×630)

#### LD+JSON
- Organization
- WebSite (SearchAction)
- BreadcrumbList
- WebPage

### 🎯 CRO & UX

#### CTA Copy
- "Adaugă în coș"
- "Vezi colecția"
- "Cumpără acum"

#### Empty States
- "Nu am găsit rezultate. Încearcă 'cutii rotunde'."

#### Badge Discount
- -% verde închis

#### Mini-cart
- Listă 2–3 iteme + total
- Butoane "Vezi coșul" / "Finalizează"

### 🎨 Art Direction Guidelines

- Fotografie luminoasă, fonduri neutre, focus produs
- Text pe imagini: max 15–20 caractere pe două rânduri
- Contrast AA pentru text pe imagini
- Nicio gradientă grea; folosește spațiu alb ca instrument de design
- Un singur accent vizual per ecran

### 🚀 Goal Final

Un homepage "calm, clar, încrezător", cu header/footer impecabile și promo-slots care arată ca layouturile curate de la eMAG, dar cu identitatea FloristMarket.

**Rezultat**: UI revoluționar, minimalist, premium, fără "zgomot", cu performanță excepțională și experiență utilizator de nivel eMAG, dar aerisit și elegant.
