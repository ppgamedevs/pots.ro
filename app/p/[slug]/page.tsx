"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateProductLDJSON } from "@/lib/seo/meta-catalog";
import { PDPGallery } from "@/components/product/PDPGallery";
import { PDPInfo } from "@/components/product/PDPInfo";
import { PDPActions } from "@/components/product/PDPActions";
import { PDPSpecs } from "@/components/product/PDPSpecs";
import { PDPShipping } from "@/components/product/PDPShipping";
import { PDPStickyBar } from "@/components/product/PDPStickyBar";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { PDPGallerySkeleton, PDPInfoSkeleton, PDPActionsSkeleton } from "@/components/common/Skeletons";

// Types
interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: {
    src: string;
    alt: string;
  }[];
  seller: {
    name: string;
    href: string;
  };
  stockLabel: string;
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  attributes: {
    label: string;
    value: string;
  }[];
  category: string;
  tags: string[];
}

interface ProductResponse {
  product: Product;
  similar: Product[];
}

export default function PDP() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [productData, setProductData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/catalog/product?slug=${slug}`);
        
        if (!response.ok) {
          throw new Error('Produsul nu a fost găsit');
        }
        
        const data = await response.json();
        setProductData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la încărcarea produsului');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = (quantity: number) => {
    if (productData?.product) {
      console.log('Adding to cart:', {
        product: productData.product.title,
        quantity,
        price: productData.product.price
      });
      // Implementare adăugare în coș
    }
  };


  if (loading) {
    return (
      <main className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PDPGallerySkeleton />
            <div className="space-y-6">
              <PDPInfoSkeleton />
              <PDPActionsSkeleton />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !productData) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink mb-2">Produsul nu a fost găsit</h1>
          <p className="text-muted mb-4">Produsul pe care îl căutați nu există sau a fost eliminat.</p>
          <a href="/" className="text-primary hover:text-primary/80">
            Înapoi la homepage
          </a>
        </div>
      </main>
    );
  }

  const { product, similar } = productData;

  return (
    <>
      {/* LD+JSON */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductLDJSON(product))
        }}
      />
      
      <main className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column - Gallery */}
            <div>
              <PDPGallery 
                images={product.images}
                alt={product.title}
              />
            </div>

            {/* Right Column - Info & Actions */}
            <div className="space-y-6">
              <PDPInfo
                title={product.title}
                seller={product.seller}
                price={product.price}
                oldPrice={product.oldPrice}
                stockLabel={product.stockLabel}
                badges={product.badges}
                rating={product.rating}
                reviewCount={product.reviewCount}
              />

              <PDPActions
                quantity={1}
                onAdd={handleAddToCart}
                maxQuantity={10}
              />

              <PDPShipping
                carriers={["Fan Courier", "DPD", "Cargus", "Sameday"]}
                eta="1-3 zile"
                freeShippingThreshold={200}
                currentPrice={product.price}
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-12">
            <PDPSpecs
              description={product.description}
              attributes={product.attributes}
            />
          </div>

          {/* Similar Products */}
          {similar.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-ink mb-6">Produse similare</h2>
              <ProductGrid items={similar.map(item => ({
                id: item.id,
                image: item.images[0],
                title: item.title,
                seller: item.seller.name,
                price: item.price,
                oldPrice: item.oldPrice,
                badge: item.badges?.[0] as 'nou' | 'reducere' | 'stoc redus' | undefined,
                href: `/p/${item.slug}`
              }))} />
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bar */}
      <PDPStickyBar
        price={product.price}
        oldPrice={product.oldPrice}
        cta="Adaugă în coș"
        onClick={() => handleAddToCart(1)}
        stockLabel={product.stockLabel}
      />
    </>
  );
}
