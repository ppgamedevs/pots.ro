import { notFound } from "next/navigation";
import { Metadata } from "next";
import { apiGetSeller, apiGetCategoryProducts } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SellerHeader } from "@/components/seller/SellerHeader";
import { SellerTabs } from "@/components/seller/SellerTabs";

async function getSellerAnon(slug: string) {
  try {
    const seller = await apiGetSeller(slug);
    
    // Fetch about data from API
    let aboutData = null;
    try {
      const aboutResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/seller/about`, {
        next: { revalidate: 60 } // Revalidate every minute
      });
      if (aboutResponse.ok) {
        aboutData = await aboutResponse.json();
      }
    } catch (error) {
      console.error('Failed to fetch about data:', error);
    }
    
    return {
      displayName: seller.brandName,
      description: "Partener marketplace verificat. Livrări și retururi gestionate prin Pots.",
      verified: true,
      rating: 4.7,
      totalProducts: 0, // va fi actualizat din produse
      bannerUrl: seller.bannerUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&crop=center",
      logoUrl: seller.logoUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center",
      aboutMd: aboutData?.content || `# Despre ${seller.brandName}

Acesta este un partener verificat al platformei Pots.ro, specializat în produse de calitate pentru floristică.

## Experiența noastră

Cu peste 5 ani de experiență în domeniu, ne-am specializat în:

- **Ghivece ceramice** - pentru plante de interior și exterior
- **Cutii decorative** - pentru aranjamente florale
- **Accesorii florale** - panglici, materiale decorative

## Calitatea produselor

Toate produsele noastre sunt:

- ✅ Testate pentru durabilitate
- ✅ Sigurante pentru plante
- ✅ Realizate din materiale de calitate
- ✅ Verificate înainte de livrare

## Contact

Pentru întrebări despre produse, vă rugăm să folosiți [mesageria platformei](https://pots.ro/contact) sau să ne contactați prin [email](mailto:contact@pots.ro).

## Links externe

- [Ghidul nostru de îngrijire a plantelor](https://example.com/plant-care)
- [Inspirații pentru aranjamente](https://example.com/floral-arrangements)
- [Blogul nostru](https://example.com/blog)

---

*Toate produsele sunt vândute prin Pots Marketplace. Asistența, returul și garanția sunt gestionate de Pots.*`,
      seoTitle: aboutData?.seoTitle || `Despre ${seller.brandName} - Partener Pots.ro`,
      seoDescription: aboutData?.seoDescription || `Descoperă ${seller.brandName}, partener verificat pe Pots.ro.`,
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { sellerSlug: string };
}): Promise<Metadata> {
  const seller = await getSellerAnon(params.sellerSlug);
  
  if (!seller) {
    return {
      title: "Vânzător nu găsit",
      description: "Vânzătorul căutat nu există pe platforma Pots.ro",
    };
  }

  return {
    title: seller.seoTitle || `Despre ${seller.displayName} - Partener Pots.ro`,
    description: seller.seoDescription || `Descoperă ${seller.displayName}, partener verificat pe Pots.ro.`,
    openGraph: {
      title: seller.seoTitle || `Despre ${seller.displayName}`,
      description: seller.seoDescription || `Descoperă ${seller.displayName}, partener verificat pe Pots.ro.`,
      images: seller.logoUrl ? [seller.logoUrl] : [],
    },
  };
}

export default async function SellerPage({
  params,
}: {
  params: { sellerSlug: string };
}) {
  const seller = await getSellerAnon(params.sellerSlug);
  if (!seller) return notFound();

  // Obține produsele vânzătorului (mock - în realitate ar trebui un endpoint specific)
  let products: any[] = [];
  try {
    // Pentru demo, luăm produsele din toate categoriile care aparțin sellerului
    const allCategories = ['vaze', 'ghivece', 'cutii', 'accesorii', 'ceramica'];
    const allProducts = [];
    
    for (const category of allCategories) {
      try {
        const response = await apiGetCategoryProducts(category);
        const sellerProducts = response.items.filter(p => p.sellerSlug === params.sellerSlug);
        allProducts.push(...sellerProducts);
      } catch (error) {
        // Ignore category errors
      }
    }
    
    products = allProducts;
  } catch (error) {
    products = [];
  }
  
  seller.totalProducts = products.length;

  // Convertește produsele pentru ProductGrid
  const gridProducts = products.map(product => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price * 100, // Convert to cents for compatibility
    currency: product.currency,
    imageUrl: product.image,
    sellerSlug: product.sellerSlug,
    attributes: {
      price_cents: product.price * 100,
      stock_qty: 10, // Default stock
      is_in_stock: true,
      vendor_id: 1,
      material: "ceramic" as const,
      color: "natural" as const,
      shape: "round" as const,
      style: "modern" as const,
      finish: "matte" as const,
      diameter_mm: 200,
      height_mm: 150,
      length_mm: 200,
      personalizable: false,
      painted: false,
      tags: ["ceramic", "natural", "modern"],
      ribbon_included: false,
      compatibility: ["bouquet", "box"],
      pack_units: 1,
      food_safe: false,
      created_at: new Date().toISOString(),
      popularity_score: 850,
    }
  }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header cu banner + logo */}
          <SellerHeader seller={seller} />

          {/* Tabs: Produse și Despre */}
          <div className="mt-12">
            <SellerTabs products={gridProducts} aboutMd={seller.aboutMd} />
          </div>

          {/* Disclaimer legal */}
          <div className="mt-12 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Notă importantă:</strong> Produsele sunt vândute prin Pots Marketplace. 
              Asistența, returul și garanția sunt gestionate de Pots. 
              Comunicarea cu vânzătorul se face prin mesageria internă a platformei.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
