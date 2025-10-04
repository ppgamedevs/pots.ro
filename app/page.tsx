"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PromoHero } from "@/components/promo/PromoHero";
import { PromoCard } from "@/components/promo/PromoCard";
import { UspRow } from "@/components/promo/UspRow";
import { CategoryTiles } from "@/components/promo/CategoryTiles";
import { ProductCard } from "@/components/product/ProductCard";
import { EditorialTeasers } from "@/components/promo/EditorialTeasers";
import { StructuredData } from "@/components/seo/StructuredData";
import CookieBanner from "@/components/common/CookieBanner";
import { Shield, Truck, CheckCircle, Headphones } from "lucide-react";

// Types
interface HomePromotions {
  hero: any;
  grid: any[];
  partner?: any;
}

interface Category {
  id: string;
  name: string;
  href: string;
  subcategories: any[];
}

interface FeaturedProduct {
  id: string;
  image: { src: string; alt: string };
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
}

interface BlogPost {
  id: string;
  title: string;
  image: { src: string; alt: string };
  href: string;
  readTime: string;
}

export default function Home() {
  const [promotions, setPromotions] = useState<HomePromotions | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promotionsRes, categoriesRes, productsRes, blogRes] = await Promise.all([
          fetch('/api/promotions/home'),
          fetch('/api/categories/top'),
          fetch('/api/products/featured'),
          fetch('/api/blog/teasers')
        ]);

        const [promotionsData, categoriesData, productsData, blogData] = await Promise.all([
          promotionsRes.json(),
          categoriesRes.json(),
          productsRes.json(),
          blogRes.json()
        ]);

        setPromotions(promotionsData);
        setCategories(categoriesData);
        setFeaturedProducts(productsData);
        setBlogPosts(blogData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // USP Items
  const uspItems = [
    { icon: <Shield className="w-5 h-5" />, text: "Plăți securizate" },
    { icon: <Truck className="w-5 h-5" />, text: "Retur 14 zile" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Selleri verificați" },
    { icon: <Headphones className="w-5 h-5" />, text: "Suport rapid" }
  ];

  // Footer data
  const footerColumns = [
    {
      title: "Companie",
      links: [
        { label: "Despre noi", href: "/(legal)/about" },
        { label: "Cariere", href: "/(legal)/careers" },
        { label: "Contact", href: "/(legal)/contact" },
        { label: "Presă", href: "/(legal)/press" }
      ]
    },
    {
      title: "Help Center",
      links: [
        { label: "Caută ajutor", href: "/help" },
        { label: "Comenzi", href: "/help/comenzi" },
        { label: "Livrare", href: "/help/livrare" },
        { label: "Retururi", href: "/help/retururi" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Termeni și condiții", href: "/(legal)/terms" },
        { label: "Politica de confidențialitate", href: "/(legal)/privacy" },
        { label: "Cookie-uri", href: "/(legal)/cookies" },
        { label: "GDPR", href: "/gdpr" }
      ]
    },
    {
      title: "Utile",
      links: [
        { label: "Devino vânzător", href: "/seller" },
        { label: "Blog", href: "/blog" },
        { label: "Ghiduri", href: "/guides" },
        { label: "Parteneri", href: "/partners" }
      ]
    }
  ];

  const payments = ["Visa", "Mastercard", "PayPal", "Revolut"];
  const carriers = ["Fan Courier", "DPD", "Cargus", "Sameday"];

  if (loading) {
    return (
      <>
        <SiteHeader categories={[]} suggestions={[]} />
        <main className="min-h-screen bg-bg">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-96 bg-bg-soft rounded-lg mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="h-32 bg-bg-soft rounded-lg"></div>
                <div className="h-32 bg-bg-soft rounded-lg"></div>
                <div className="h-32 bg-bg-soft rounded-lg"></div>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter columns={footerColumns} payments={payments} carriers={carriers} />
      </>
    );
  }

  return (
    <>
      <StructuredData />
      <SiteHeader 
        categories={categories} 
        suggestions={["ghivece ceramica", "cutii rotunde", "ambalaje hârtie", "accesorii decorative"]} 
      />
      
      <main className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
          {/* Slot A: Hero */}
          {promotions?.hero && (
            <PromoHero
              title={promotions.hero.title}
              subtitle={promotions.hero.subtitle}
              image={promotions.hero.image}
              ctaPrimary={promotions.hero.ctaPrimary}
              ctaSecondary={promotions.hero.ctaSecondary}
            />
          )}

          {/* USPs Row */}
          <UspRow items={uspItems} />

          {/* Slot B, C, D: Grid Promo */}
          {promotions?.grid && promotions.grid.length > 0 && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card mare */}
                <div className="lg:col-span-2">
                  <PromoCard
                    title={promotions.grid[0]?.title || "Colecția de toamnă"}
                    image={promotions.grid[0]?.image || { src: "/placeholder.png", alt: "Colecția de toamnă" }}
                    href={promotions.grid[0]?.href || "/c/toamna"}
                    tone="dark"
                  />
                </div>
                
                {/* Carduri mici */}
                <div className="space-y-6">
                  {promotions.grid.slice(1, 3).map((item, index) => (
                    <PromoCard
                      key={index}
                      title={item.title}
                      image={item.image}
                      href={item.href}
                      tone="light"
                    />
                  ))}
                </div>
          </div>
            </section>
          )}

          {/* Categorii principale */}
          <CategoryTiles 
            items={categories.slice(0, 3).map(cat => ({
              name: cat.name,
              image: { src: "/placeholder.png", alt: cat.name },
              href: cat.href
            }))}
          />

          {/* Produse recomandate */}
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-ink mb-2">Produse recomandate</h2>
              <p className="text-muted">Descoperă cele mai populare produse din marketplace</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard 
                  key={product.id}
                  image={product.image}
                  title={product.title}
                  seller={product.seller}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  badge={product.badge}
                  href={product.href}
                />
              ))}
            </div>
          </section>

          {/* Editorial/Blog */}
          <EditorialTeasers posts={blogPosts} />

          {/* Slot E: Banner partener */}
          {promotions?.partner && (
            <section className="py-8">
              <PromoCard
                title={promotions.partner.title}
                image={promotions.partner.image}
                href={promotions.partner.href}
                tone="light"
              />
            </section>
          )}
        </div>
      </main>
      
      <SiteFooter 
        columns={footerColumns} 
        payments={payments} 
        carriers={carriers} 
      />
      
      <CookieBanner />
    </>
  );
}