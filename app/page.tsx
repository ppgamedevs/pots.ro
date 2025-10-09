"use client";

import { useEffect, useState } from "react";
import { PromoHero } from "@/components/promo/PromoHero";
import { PromoCard } from "@/components/promo/PromoCard";
import { UspRow } from "@/components/promo/UspRow";
import { CategoryTiles } from "@/components/promo/CategoryTiles";
import { ProductCard } from "@/components/product/ProductCard";
import { EditorialTeasers } from "@/components/promo/EditorialTeasers";
import { StructuredData } from "@/components/seo/StructuredData";
import TrustedPartners from "@/components/TrustedPartners";
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


  if (loading) {
    return (
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
    );
  }

  return (
    <>
      <StructuredData />
      
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
                    title={promotions.grid[0]?.title || "Reducerile lunii"}
                    subtitle={promotions.grid[0]?.subtitle}
                    image={promotions.grid[0]?.image || { src: "/banners/deals.png", alt: "Reducerile lunii" }}
                    href={promotions.grid[0]?.href || "/reduceri"}
                    tone="dark"
                    ctaPrimary={promotions.grid[0]?.ctaPrimary}
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
                      tone={/(cutii|ghivece)/i.test(item.title) ? 'dark' : 'light'}
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
              image: { 
                src: cat.id === 'ambalaje' 
                  ? '/images/ambalaje-buchete.jpg' 
                  : cat.id === 'cutii' 
                    ? '/images/cutii-rotunde-roz.jpg' 
                    : cat.id === 'ghivece' 
                      ? '/images/ghiveci-gri.jpg' 
                      : '/placeholder.png',
                alt: cat.name 
              },
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

          {/* Trusted Partners Section */}
          <TrustedPartners />

        </div>
      </main>
    </>
  );
}