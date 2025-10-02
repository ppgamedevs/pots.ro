"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import ProductForm from "@/components/seller/ProductForm";
import type { SellerProduct } from "@/lib/types";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const initialData: Partial<SellerProduct> = {
    title: "",
    description: "",
    price: 0,
    currency: "RON",
    categoryId: "",
    status: "draft",
    images: [],
    stock: 0,
    sku: "",
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
  };

  const handleSave = async (data: SellerProduct, action: "draft" | "publish") => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = action === "publish" ? "active" : "draft";
      
      toast(`Produsul a fost ${action === "publish" ? "publicat" : "salvat ca draft"} cu succes.`, "success");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Adaugă produs nou
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Completează informațiile despre produsul tău
        </p>
      </div>

      <ProductForm
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
