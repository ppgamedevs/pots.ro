"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryHeader } from "@/components/catalog/CategoryHeader";
import { FiltersBar } from "@/components/catalog/FiltersBar";
import { SortDropdown } from "@/components/catalog/SortDropdown";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  images: { src: string; alt: string }[];
  seller: { name: string };
  badges?: string[];
  stock?: number;
}

interface Facet {
  key: string;
  label: string;
  type: "checkbox" | "range" | "select";
  options: { value: string; label: string; count: number }[];
}

interface CategoryData {
  title: string;
  subtitle: string;
  image?: string;
  slug: string;
}

interface PLPClientProps {
  category: CategoryData;
  initialItems: Product[];
  totalProducts: number;
  facets: Facet[];
  currentPage: number;
  totalPages: number;
}

const sortOptions = [
  { label: "Relevanță", value: "relevance" },
  { label: "Preț crescător", value: "price_asc" },
  { label: "Preț descrescător", value: "price_desc" },
  { label: "Noutăți", value: "newest" },
  { label: "Rating", value: "rating" },
];

function PLPClientContent({
  category,
  initialItems,
  totalProducts,
  facets,
  currentPage,
  totalPages,
}: PLPClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse filters from URL
  const filtersParam = searchParams.get("filters") || "{}";
  const sortParam = searchParams.get("sort") || "relevance";
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(filtersParam);
    } catch {
      return {};
    }
  });
  const [sortBy, setSortBy] = useState(sortParam);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
    const params = new URLSearchParams(searchParams.toString());
    params.set("filters", JSON.stringify(filters));
    params.set("page", "1");
    router.push(`/c/${category.slug}?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.set("page", "1");
    router.push(`/c/${category.slug}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/c/${category.slug}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedFilters({});
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filters");
    params.set("page", "1");
    router.push(`/c/${category.slug}?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-bg">
      {/* Category Header */}
      <CategoryHeader
        title={category.title}
        subtitle={category.subtitle}
        image={category.image ? { src: category.image, alt: category.title } : undefined}
        productCount={totalProducts}
      />

      {/* Filters Bar */}
      <FiltersBar facets={facets} selected={selectedFilters} onChange={handleFilterChange} />

      {/* Controls */}
      <div className="bg-bg border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted">{totalProducts} produse găsite</div>
            <SortDropdown value={sortBy} onChange={handleSortChange} options={sortOptions} />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {initialItems.length > 0 ? (
          <>
            <ProductGrid
              items={initialItems.map((item) => ({
                id: item.id,
                image: item.images[0],
                title: item.title,
                seller: item.seller.name,
                price: item.price,
                oldPrice: item.oldPrice,
                badge: item.badges?.[0] as "nou" | "reducere" | "stoc redus" | undefined,
                href: `/p/${item.slug}`,
                stockQty: item.stock ?? 10,
              }))}
            />

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalProducts}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-ink mb-2">Nu am găsit rezultate</h3>
            <p className="text-muted mb-4">Încearcă să ajustezi filtrele sau să cauți altceva.</p>
            <button onClick={clearFilters} className="text-primary hover:text-primary/80">
              Șterge toate filtrele
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export function PLPClient(props: PLPClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <PLPClientContent {...props} />
    </Suspense>
  );
}
