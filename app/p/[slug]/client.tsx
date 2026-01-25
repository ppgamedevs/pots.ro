"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/use-toast";
import { mutate as globalMutate } from "swr";
import { PDPGallery } from "@/components/product/PDPGallery";
import { PDPInfo } from "@/components/product/PDPInfo";
import { PDPActions } from "@/components/product/PDPActions";
import { PDPSpecs } from "@/components/product/PDPSpecs";
import { PDPShipping } from "@/components/product/PDPShipping";
import { PDPStickyBar } from "@/components/product/PDPStickyBar";
import { ProductGrid } from "@/components/catalog/ProductGrid";

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
  stockQty: number;
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

interface SimilarProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  images: { src: string; alt: string }[];
  seller: { name: string; href: string };
  badges?: string[];
}

interface PDPClientProps {
  product: Product;
}

export function PDPClient({ product }: PDPClientProps) {
  const { toast } = useToast();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(200);
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  // Fetch shipping settings
  useEffect(() => {
    let cancelled = false;

    const fetchShippingSettings = async () => {
      try {
        const res = await fetch("/api/settings/shipping-fee", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const threshold = Number(data?.freeShippingThresholdRON);
        if (!cancelled && Number.isFinite(threshold)) {
          setFreeShippingThreshold(threshold);
        }
      } catch {
        // non-blocking
      }
    };

    fetchShippingSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch similar products
  useEffect(() => {
    let cancelled = false;

    const fetchSimilar = async () => {
      try {
        setLoadingSimilar(true);
        const res = await fetch(`/api/catalog/similar?productId=${product.id}&limit=8`);
        if (!res.ok) {
          setSimilar([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setSimilar(data.items || []);
        }
      } catch {
        if (!cancelled) setSimilar([]);
      } finally {
        if (!cancelled) setLoadingSimilar(false);
      }
    };

    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleAddToCart = async (quantity: number) => {
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: product.id,
          qty: quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Add to cart error:", error);
        toast(error.error || "Nu s-a putut adăuga produsul în coș.", "error");
        return;
      }

      const result = await response.json();
      console.log("Add to cart success:", result);

      // Fetch fresh cart data and update all subscribers globally
      const freshCart = await fetch("/api/cart", {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      }).then((res) => res.json());
      await globalMutate("/api/cart", freshCart, false);

      toast(`Produsul a fost adăugat în coș (${quantity} bucăți).`, "success");
    } catch (error) {
      console.error("Add to cart exception:", error);
      toast("Nu s-a putut adăuga produsul în coș.", "error");
    }
  };

  return (
    <>
      <main className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column - Gallery */}
            <div>
              <PDPGallery images={product.images} alt={product.title} />
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

              <PDPActions quantity={1} onAdd={handleAddToCart} maxQuantity={Math.min(product.stockQty, 10)} />

              <PDPShipping
                carriers={["Cargus"]}
                eta="1-3 zile"
                freeShippingThreshold={freeShippingThreshold}
                currentPrice={product.price}
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-12">
            <PDPSpecs description={product.description} attributes={product.attributes} />
          </div>

          {/* Similar Products */}
          {!loadingSimilar && similar.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-ink mb-6">Produse similare</h2>
              <ProductGrid
                items={similar.map((item) => ({
                  id: item.id,
                  image: item.images[0],
                  title: item.title,
                  seller: item.seller.name,
                  price: item.price,
                  oldPrice: item.oldPrice,
                  badge: item.badges?.[0] as "nou" | "reducere" | "stoc redus" | undefined,
                  href: `/p/${item.slug}`,
                }))}
              />
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
