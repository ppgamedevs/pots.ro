"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import ProductForm from "@/components/seller/ProductForm";
import type { SellerProduct } from "@/lib/types";

// Mock data for demonstration
const mockProduct: SellerProduct = {
  id: "1",
  title: "Vază ceramică - Natur",
  description: "Vază ceramică elegantă, perfectă pentru aranjamente florale moderne.",
  price: 129.0,
  currency: "RON",
  categoryId: "ceramics",
  status: "active",
  images: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center"
  ],
  stock: 12,
  sku: "VAZA-001",
  weight: 0.5,
  dimensions: {
    length: 15,
    width: 15,
    height: 25,
  },
  createdAt: "2024-12-01T10:00:00Z",
  updatedAt: "2024-12-15T14:30:00Z"
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch product
    const fetchProduct = async () => {
      try {
        const { id } = await params;
        await new Promise(resolve => setTimeout(resolve, 500));
        setProduct(mockProduct);
      } catch (error) {
        toast("Nu s-a putut încărca produsul.", "error");
        router.push("/dashboard/products");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProduct();
  }, [params, router, toast]);

  const handleSave = async (data: SellerProduct, action: "draft" | "publish") => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast(`Produsul a fost ${action === "publish" ? "publicat" : "salvat"} cu succes.`, "success");

      router.push("/dashboard/products");
    } catch (error) {
      toast("Nu s-a putut salva produsul.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/products");
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Produsul nu a fost găsit
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Produsul pe care îl cauți nu există sau nu ai permisiunea să îl editezi.
        </p>
        <button
          onClick={() => router.push("/dashboard/products")}
          className="btn btn-primary"
        >
          Înapoi la produse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Editează produs
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Modifică informațiile despre produsul tău
        </p>
      </div>

      <ProductForm
        initialData={product}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
