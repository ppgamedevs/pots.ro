// FloristMarket - Minimal UI Shell + PDP & Category (TSX + Tailwind skeleton)
// Stack: Next.js (App Router compatible), React, Tailwind. No external deps beyond icons if desired.
// Split into files later. For now, a single scaffold you can paste and carve.

import React from "react";

/* =========================
   0) DESIGN TOKENS (Tailwind suggested)
   - Tailwind config should map:
     colors: { primary: '#1C6B5A', ink: '#1F2421', muted: '#6B6B6B', line: '#ECECEC', bgsoft: '#F7F4F1' }
   - Font: Inter/Manrope via @next/font or link.
========================= */

/* =========================
   1) GLOBAL SHELL - Header / Footer
========================= */

export function TopBar() {
  return (
    <div className="hidden md:block bg-bg-soft text-muted text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-6">
        <span>Plăți securizate</span>
        <span className="h-3 w-px bg-line" />
        <span>Retur 14 zile</span>
        <span className="h-3 w-px bg-line" />
        <span>Selleri verificați</span>
      </div>
    </div>
  );
}

export function MainBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        <button className="md:hidden p-2" aria-label="Deschide meniul" onClick={onOpenMenu}>
          <span className="i-lucide:menu h-5 w-5" />
        </button>
        <a href="/" className="text-xl font-semibold tracking-tight text-ink">FloristMarket</a>
        <nav className="hidden md:flex items-center gap-5 ml-8 text-sm text-ink/80">
          <a href="/c/ghivece" className="hover:text-ink">Ghivece</a>
          <a href="/c/cutii" className="hover:text-ink">Cutiile</a>
          <a href="/c/ambalaje" className="hover:text-ink">Ambalaje</a>
          <a href="/c/accesorii" className="hover:text-ink">Accesorii</a>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <SearchBar />
          <a href="/seller" className="hidden sm:inline-flex text-sm px-3 py-2 border border-line rounded-lg hover:bg-bg-soft">Devino vânzător</a>
          <a href="/account" aria-label="Cont" className="p-2"><span className="i-lucide:user h-5 w-5" /></a>
          <a href="/favorite" aria-label="Favorite" className="p-2"><span className="i-lucide:heart h-5 w-5" /></a>
          <a href="/cos" aria-label="Coș" className="p-2 relative">
            <span className="i-lucide:shopping-cart h-5 w-5" />
            <span className="absolute -right-1 -top-1 bg-primary text-white text-[10px] leading-4 px-1 rounded">2</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header>
      <TopBar />
      <MainBar />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-10">
        <FooterCol title="Companie" links={[{label:"Despre",href:"/despre"},{label:"Blog",href:"/blog"},{label:"Cariere",href:"/cariere"}]} />
        <FooterCol title="Ajutor" links={[{label:"Contact",href:"/contact"},{label:"Întrebări frecvente",href:"/faq"},{label:"Retur & livrare",href:"/livrare-retur"}]} />
        <FooterCol title="Legal" links={[{label:"Termeni",href:"/termeni"},{label:"Confidențialitate",href:"/confidentialitate"},{label:"Cookies",href:"/cookies"}]} />
        <FooterCol title="Utile" links={[{label:"Sitemaps",href:"/seo"},{label:"Ghid mărimi",href:"/ghid"},{label:"Devino vânzător",href:"/seller"}]} />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted flex flex-col md:flex-row items-center gap-4 md:justify-between">
          <div>© {new Date().getFullYear()} FloristMarket • Toate drepturile rezervate</div>
          <div className="flex items-center gap-4">
            <span>ANPC</span>
            <span>SOL</span>
            <span className="h-4 w-px bg-line" />
            <span>Visa • Mastercard • Curieri</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-ink font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-ink/80">
        {links.map((l) => (
          <li key={l.href}><a className="hover:text-ink" href={l.href}>{l.label}</a></li>
        ))}
      </ul>
    </div>
  );
}

export function SearchBar() {
  return (
    <form role="search" className="hidden md:flex items-center gap-2 w-[380px]">
      <div className="flex-1 flex items-center gap-2 border border-line rounded-lg px-3 py-2">
        <span className="i-lucide:search h-4 w-4 text-muted" />
        <input className="w-full outline-none placeholder:text-muted text-sm" placeholder="Caută ghivece, cutii, accesorii…" />
      </div>
      <button className="hidden lg:inline-flex text-sm px-3 py-2 bg-primary text-white rounded-lg">Caută</button>
    </form>
  );
}

/* =========================
   2) HOMEPAGE - Hero, USPs, Promo Grid, Categories, Featured Products, Editorial
========================= */

export function PromoHero(props: { title: string; subtitle?: string; imageUrl: string; ctaPrimary: { label: string; href: string }; ctaSecondary?: { label: string; href: string } }) {
  const { title, subtitle, imageUrl, ctaPrimary, ctaSecondary } = props;
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-8 items-center py-12 md:py-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-4 text-ink/70 max-w-prose">{subtitle}</p>}
          <div className="mt-6 flex items-center gap-3">
            <a href={ctaPrimary.href} className="inline-flex px-5 py-3 bg-primary text-white rounded-lg">{ctaPrimary.label}</a>
            {ctaSecondary && <a href={ctaSecondary.href} className="inline-flex px-5 py-3 border border-line rounded-lg">{ctaSecondary.label}</a>}
          </div>
        </div>
        <div className="aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden border border-line bg-bg-soft">
          <img src={imageUrl} alt="FloristMarket hero" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

export function UspRow({ items }: { items: { icon?: React.ReactNode; text: string }[] }) {
  return (
    <section className="border-t border-b border-line bg-bg-soft/60">
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-ink/80">
            {it.icon ?? <span className="i-lucide:leaf h-5 w-5 text-primary" />}
            <span>{it.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PromoCard({ title, imageUrl, href, tone = 'light' }: { title: string; imageUrl: string; href: string; tone?: 'light' | 'dark' }) {
  return (
    <a href={href} className="group relative overflow-hidden rounded-xl border border-line block">
      <img src={imageUrl} alt={title} className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      <div className={`absolute inset-0 ${tone === 'dark' ? 'bg-black/30' : 'bg-gradient-to-t from-black/40 to-transparent'}`} />
      <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow"><h3 className="text-lg font-semibold">{title}</h3></div>
    </a>
  );
}

export function CategoryTiles({ items }: { items: { name: string; imageUrl: string; href: string }[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((c) => (
          <a key={c.href} href={c.href} className="rounded-xl overflow-hidden border border-line group">
            <div className="aspect-[4/3] bg-bg-soft">
              <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            </div>
            <div className="p-4"><h3 className="text-ink font-medium">{c.name}</h3></div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* = Product Card ======================================================= */
export type ProductCardProps = { imageUrl: string; title: string; price: number; oldPrice?: number; seller: string; href: string; badge?: 'nou'|'reducere'|'stoc redus' };

export function ProductCard({ imageUrl, title, price, oldPrice, seller, href, badge }: ProductCardProps) {
  return (
    <a href={href} className="block rounded-xl border border-line overflow-hidden hover:shadow-card transition-shadow">
      <div className="relative">
        <img src={imageUrl} alt={title} className="h-56 w-full object-cover bg-bg-soft" />
        {badge && (
          <span className="absolute top-3 right-3 text-xs bg-primary text-white px-2 py-1 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm text-ink">{title}</h3>
        <div className="mt-1 text-xs text-muted">{seller}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-ink font-semibold">{price.toFixed(2)} RON</div>
          {oldPrice && <div className="text-muted line-through text-sm">{oldPrice.toFixed(2)} RON</div>}
        </div>
        <div className="mt-3"><button className="w-full text-sm bg-primary text-white py-2 rounded-lg">Adaugă în coș</button></div>
      </div>
    </a>
  );
}

export function ProductGrid({ items }: { items: ProductCardProps[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((p) => <ProductCard key={p.href} {...p} />)}
      </div>
    </section>
  );
}

/* =========================
   3) PDP - components
========================= */
export function PDPGallery({ images, alt }: { images: { src: string }[]; alt: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-2">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-bg-soft">
        <img src={images[0]?.src} alt={alt} className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {images.slice(0,4).map((im, i) => (
          <img key={i} src={im.src} alt={`thumb ${i+1}`} className="h-16 w-full object-cover rounded border border-line" />
        ))}
      </div>
    </div>
  );
}

export function PDPInfo({ title, seller, price, oldPrice, stockLabel, badges }: { title: string; seller: { name: string; href: string }; price: number; oldPrice?: number; stockLabel: string; badges?: string[] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold text-ink">{title}</h1>
      <div className="text-sm text-muted">de <a href={seller.href} className="underline hover:text-ink">{seller.name}</a></div>
      <div className="flex items-baseline gap-3">
        <div className="text-2xl font-semibold text-ink">{price.toFixed(2)} RON</div>
        {oldPrice && <div className="text-muted line-through">{oldPrice.toFixed(2)} RON</div>}
      </div>
      <div className="text-sm text-ink/80">{stockLabel}</div>
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => <span key={b} className="text-xs px-2 py-1 border border-line rounded-full">{b}</span>)}
        </div>
      )}
    </div>
  );
}

export function PDPActions() {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex items-center border border-line rounded-lg overflow-hidden">
        <button className="px-3 py-2" aria-label="Scade">−</button>
        <input className="w-10 text-center outline-none" defaultValue={1} aria-label="Cantitate" />
        <button className="px-3 py-2" aria-label="Crește">＋</button>
      </div>
      <button className="flex-1 bg-primary text-white px-5 py-3 rounded-lg">Adaugă în coș</button>
    </div>
  );
}

export function PDPShipping({ carriers, eta }: { carriers: string[]; eta: string }) {
  return (
    <div className="mt-6 p-4 rounded-xl border border-line bg-white">
      <div className="text-sm text-ink/80">Livrare estimată: <span className="font-medium text-ink">{eta}</span></div>
      <div className="mt-2 text-sm text-muted">Curieri: {carriers.join(', ')}</div>
    </div>
  );
}

export function PDPSpecs({ description, attributes }: { description: string; attributes: { label: string; value: string }[] }) {
  return (
    <section className="mt-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h2 className="text-lg font-semibold text-ink">Descriere</h2>
        <p className="mt-3 text-ink/80 leading-relaxed">{description}</p>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-ink">Detalii</h3>
        <dl className="mt-3 divide-y divide-line">
          {attributes.map((a) => (
            <div key={a.label} className="py-2 grid grid-cols-2 text-sm">
              <dt className="text-muted">{a.label}</dt>
              <dd className="text-ink">{a.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* =========================
   4) CATEGORY - components
========================= */
export function CategoryHeader({ title, subtitle, imageUrl }: { title: string; subtitle?: string; imageUrl?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-10 flex items-center gap-6">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-ink/70 max-w-prose">{subtitle}</p>}
      </div>
      {imageUrl && (
        <div className="hidden md:block w-56 h-32 rounded-lg overflow-hidden border border-line bg-bg-soft">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
    </section>
  );
}

export function FiltersBar() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 border-y border-line bg-white">
      <button className="px-3 py-2 border border-line rounded-lg text-sm">Filtre</button>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className="text-muted hidden md:inline">Sortează:</span>
        <select className="border border-line rounded-lg px-3 py-2 bg-white">
          <option value="relevance">Relevanță</option>
          <option value="price_asc">Preț crescător</option>
          <option value="price_desc">Preț descrescător</option>
          <option value="new">Noutăți</option>
        </select>
      </div>
    </div>
  );
}

export function Pagination({ page = 1, totalPages = 5 }: { page?: number; totalPages?: number }) {
  return (
    <nav aria-label="Paginare" className="mx-auto max-w-7xl px-4 py-10 flex items-center justify-center gap-2">
      <a className="px-3 py-2 border border-line rounded-lg text-sm" href="#">« Înapoi</a>
      {Array.from({ length: totalPages }).map((_, i) => (
        <a key={i} className={`px-3 py-2 border rounded-lg text-sm ${i + 1 === page ? 'bg-ink text-white border-ink' : 'border-line'}`} href="#">{i + 1}</a>
      ))}
      <a className="px-3 py-2 border border-line rounded-lg text-sm" href="#">Înainte »</a>
    </nav>
  );
}

/* =========================
   5) SAMPLE PAGES (wire-up)
========================= */
export function HomePageSample() {
  return (
    <div>
      <SiteHeader />
      <PromoHero
        title="Marketplace de floristică."
        subtitle="Tot ce ai nevoie pentru flori, ambalaje, cutii și accesorii - într-un singur loc."
        imageUrl="/images/hero-demo.jpg"
        ctaPrimary={{ label: "Descoperă produse", href: "/c/ghivece" }}
        ctaSecondary={{ label: "Devino vânzător", href: "/seller" }}
      />
      <UspRow items={[{ text: "Plăți securizate" }, { text: "Retur 14 zile" }, { text: "Selleri verificați" }, { text: "Suport rapid" }]} />

      <section className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-3 gap-6">
        <PromoCard title="Colecția de ghivece" imageUrl="/images/promo1.jpg" href="/c/ghivece" />
        <PromoCard title="Cutiile preferate" imageUrl="/images/cutii-elegante-rosii.jpg" href="/c/cutii" />
        <PromoCard title="Accesorii esențiale" imageUrl="/images/promo3.jpg" href="/c/accesorii" />
      </section>

      <CategoryTiles items={[
        { name: "Ghivece", imageUrl: "/images/cat-ghivece.jpg", href: "/c/ghivece" },
        { name: "Cutiile", imageUrl: "/images/cutii-elegante-rosii.jpg", href: "/c/cutii" },
        { name: "Accesorii", imageUrl: "/images/cat-accesorii.jpg", href: "/c/accesorii" },
      ]} />

      <ProductGrid items={[
        { imageUrl: "/images/p1.jpg", title: "Ghiveci ceramic alb M", price: 89.9, seller: "Atelier Verde", href: "/p/ghiveci-ceramic-alb-m" },
        { imageUrl: "/images/p2.jpg", title: "Cutie rotundă satinată S", price: 49.9, seller: "Box&Co", href: "/p/cutie-rotunda-satinata-s" },
        { imageUrl: "/images/p3.jpg", title: "Fundă dublă 25mm verde", price: 19.9, seller: "RibbonArt", href: "/p/funda-dubla-25mm-verde" },
        { imageUrl: "/images/p4.jpg", title: "Pământ universal 10L", price: 29.9, seller: "GreenMix", href: "/p/pamant-universal-10l" },
      ]} />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-semibold text-ink mb-6">Inspirație</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <PromoCard title="Trenduri florale 2026" imageUrl="/images/blog1.jpg" href="/blog/trenduri-2026" tone="dark" />
          <PromoCard title="Ghid: cutii potrivite" imageUrl="/images/blog2.jpg" href="/blog/ghid-cutii" tone="dark" />
          <PromoCard title="5 idei pentru vitrină" imageUrl="/images/blog3.jpg" href="/blog/idei-vitrina" tone="dark" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export function PDPSample() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-2 gap-10">
        <PDPGallery images={[{src:"/images/p1.jpg"},{src:"/images/p2.jpg"},{src:"/images/p3.jpg"}]} alt="Ghiveci ceramic" />
        <div>
          <PDPInfo title="Ghiveci ceramic alb M" seller={{ name: "Atelier Verde", href: "/s/atelier-verde" }} price={89.9} oldPrice={99.9} stockLabel="În stoc" badges={["nou"]} />
          <PDPActions />
          <PDPShipping carriers={["Cargus","DPD"]} eta="1–3 zile" />
        </div>
      </main>
      <section className="mx-auto max-w-7xl px-4">
        <PDPSpecs description="Ghiveci ceramic cu finisaj mat, ideal pentru aranjamente minimaliste." attributes={[{ label: "Material", value: "Ceramică" }, { label: "Diametru", value: "18 cm" }]} />
      </section>
      <ProductGrid items={[
        { imageUrl: "/images/p2.jpg", title: "Cutie rotundă satinată S", price: 49.9, seller: "Box&Co", href: "/p/cutie-rotunda-satinata-s" },
        { imageUrl: "/images/p3.jpg", title: "Fundă dublă 25mm verde", price: 19.9, seller: "RibbonArt", href: "/p/funda-dubla-25mm-verde" },
      ]} />
      <SiteFooter />
    </div>
  );
}

export function CategorySample() {
  return (
    <div>
      <SiteHeader />
      <CategoryHeader title="Ghivece" subtitle="Ghivece ceramice, metalice și din beton pentru aranjamente atemporale." imageUrl="/images/cat-ghivece.jpg" />
      <FiltersBar />
      <ProductGrid items={[
        { imageUrl: "/images/p1.jpg", title: "Ghiveci ceramic alb M", price: 89.9, seller: "Atelier Verde", href: "/p/ghiveci-ceramic-alb-m" },
        { imageUrl: "/images/p4.jpg", title: "Pământ universal 10L", price: 29.9, seller: "GreenMix", href: "/p/pamant-universal-10l" },
        { imageUrl: "/images/p5.jpg", title: "Ghiveci beton L", price: 129.9, seller: "StonePot", href: "/p/ghiveci-beton-l" },
        { imageUrl: "/images/p6.jpg", title: "Ghiveci metalic S", price: 59.9, seller: "MetalArt", href: "/p/ghiveci-metalic-s" },
      ]} />
      <Pagination />
      <SiteFooter />
    </div>
  );
}
