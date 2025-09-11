import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiGetProductById } from "@/lib/api-client";
import { absoluteUrl } from "@/lib/url";
import { buildProductLdJson } from "@/lib/seo/productLd";
import ProductCarousel from "@/components/product/ProductCarousel";
import ProductSpecs from "@/components/product/ProductSpecs";
import VendorBoxAnonymized from "@/components/product/VendorBoxAnonymized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatus, stockBadgeConfig } from "@/lib/schemas/product-attributes";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import AddToCartButton from "@/components/cart/AddToCartButton";

type Params = { id: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    const product = await apiGetProductById(Number(params.id));
    
    const url = absoluteUrl(`/p/${product.id}-${product.slug}`);
    const title = `${product.title} | Pots.ro`;
    const description = product.seoDescription || product.shortDescription || product.title;
    const ogImage = product.images?.[0]?.url || "/og/default-product.jpg";

    return {
      title,
      description,
      openGraph: {
        type: "website",
        url,
        title,
        description,
        images: [{ url: ogImage }],
      },
      alternates: { canonical: url },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    return {};
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return notFound();

  let product;
  try {
    product = await apiGetProductById(id);
    if (product.slug !== params.slug) return notFound();
  } catch (error) {
    return notFound();
  }

  const ld = buildProductLdJson(product);
  
  // Get stock status for badge
  const stockQty = product.stockQty || 0;
  const stockStatus = getStockStatus(stockQty);
  const stockBadge = stockBadgeConfig[stockStatus];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { name: "Categorii", href: "/c" },
              { name: product.category || "Produse", href: `/c/${product.category?.toLowerCase() || "produse"}` },
              { name: product.title, href: `/p/${product.id}-${product.slug}` },
            ]} 
            className="mb-6" 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Galerie imagini */}
            <ProductCarousel images={product.images} />
            
            {/* Informații produs */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {product.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {product.price.toFixed(2)} {product.currency}
                  </div>
                  <Badge 
                    variant={stockBadge.variant}
                    className={stockBadge.className}
                  >
                    {stockBadge.label}
                  </Badge>
                </div>
              </div>

              {/* Vândut prin Pots – fără identitatea firmei */}
              <VendorBoxAnonymized />

              {/* Add to Cart Button */}
              <AddToCartButton
                productId={product.id}
                stockQty={stockQty}
                showQuantitySelector={true}
                className="w-full"
                size="lg"
              />

              {/* Descriere */}
              {product.descriptionHtml ? (
                <div
                  className="prose max-w-none text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Descriere
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {/* Specificații / atribute */}
              <ProductSpecs product={product} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const revalidate = 1800; // ISR: 30m