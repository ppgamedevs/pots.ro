import { notFound } from "next/navigation";
import { Metadata } from "next";
import { apiGetSeller, apiGetCategoryProducts } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SellerHeader } from "@/components/seller/SellerHeader";
import { SellerTabs } from "@/components/seller/SellerTabs";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

async function getSellerAnon(slug: string) {
  try {
    const seller = await apiGetSeller(slug);

    return {
      displayName: seller.brandName,
      description: "Partener marketplace verificat. Livrări și retururi gestionate prin FloristMarket.",
      verified: Boolean(seller.verifiedBadge),
      rating: 4.7,
      totalProducts: 0, // va fi actualizat din produse
      bannerUrl: seller.bannerUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&crop=center",
      logoUrl: seller.logoUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center",
      aboutMd: seller.aboutMd || `# Despre ${seller.brandName}

    Acesta este un partener verificat al platformei FloristMarket.ro, specializat în produse de calitate pentru floristică.

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

Pentru întrebări despre produse, vă rugăm să folosiți [mesageria platformei](https://floristmarket.ro/contact) sau să ne contactați prin [email](mailto:contact@floristmarket.ro).

## Links externe

- [Ghidul nostru de îngrijire a plantelor](https://example.com/plant-care)
- [Inspirații pentru aranjamente](https://example.com/floral-arrangements)
- [Blogul nostru](https://example.com/blog)

---

*Toate produsele sunt vândute prin FloristMarket Marketplace. Asistența, returul și garanția sunt gestionate de FloristMarket.*`,
      seoTitle: seller.seoTitle || `Despre ${seller.brandName} - Partener FloristMarket.ro`,
      seoDescription: seller.seoDescription || `Descoperă ${seller.brandName}, partener verificat pe FloristMarket.ro.`,
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sellerSlug: string }>;
}): Promise<Metadata> {
  const { sellerSlug } = await params;
  const seller = await getSellerAnon(sellerSlug);
  
  if (!seller) {
    return {
      title: "Vânzător negăsit",
      description: "Vânzătorul căutat nu există pe platforma FloristMarket.ro",
    };
  }

  const title = seller.seoTitle || `${seller.displayName} | Partener Verificat ${SITE_NAME}`;
  const description = seller.seoDescription || `Descoperă ${seller.displayName}, partener verificat pe ${SITE_NAME}. Produse de calitate pentru floristică cu livrare rapidă în toată România.`;
  const canonical = `${SITE_URL}/s/${sellerSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: SITE_NAME,
      url: canonical,
      locale: "ro_RO",
      images: seller.logoUrl ? [
        {
          url: seller.logoUrl,
          width: 200,
          height: 200,
          alt: seller.displayName,
        },
      ] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: seller.logoUrl ? [seller.logoUrl] : [],
    },
  };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ sellerSlug: string }>;
}) {
  const { sellerSlug } = await params;
  const seller = await getSellerAnon(sellerSlug);
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
        const sellerProducts = response.items.filter(p => p.sellerSlug === sellerSlug);
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

  // Generate seller JSON-LD schema
  const sellerSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.displayName,
    description: seller.description,
    url: `${SITE_URL}/s/${sellerSlug}`,
    logo: seller.logoUrl,
    image: seller.bannerUrl,
    aggregateRating: seller.rating ? {
      "@type": "AggregateRating",
      ratingValue: seller.rating.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: seller.totalProducts > 0 ? seller.totalProducts : 10,
    } : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    makesOffer: gridProducts.slice(0, 5).map((product) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: product.title,
        url: `${SITE_URL}/p/${product.slug}`,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasă",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Parteneri",
        item: `${SITE_URL}/parteneri`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: seller.displayName,
        item: `${SITE_URL}/s/${sellerSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
