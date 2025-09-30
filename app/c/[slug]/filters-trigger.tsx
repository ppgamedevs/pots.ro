"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullHeightFilters, FiltersState } from "@/components/ui/full-height-filters";
import { ProductGrid } from "@/components/ui/product-grid";
import { EmptyState } from "@/components/ui/empty-states";

interface CategoryFiltersClientProps {
  products: any[];
  categorySlug: string;
}

export default function CategoryFiltersClient({ 
  products, 
  categorySlug 
}: CategoryFiltersClientProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({});
  const [filteredProducts, setFilteredProducts] = useState(products);

  const applyFilters = (newFilters: FiltersState) => {
    setFilters(newFilters);
    
    let filtered = [...products];

    // Apply price filter
    if (newFilters.priceMin !== null && newFilters.priceMin !== undefined) {
      filtered = filtered.filter(p => p.price >= newFilters.priceMin!);
    }
    if (newFilters.priceMax !== null && newFilters.priceMax !== undefined) {
      filtered = filtered.filter(p => p.price <= newFilters.priceMax!);
    }

    // Apply color filter
    if (newFilters.color && newFilters.color.length > 0) {
      filtered = filtered.filter(p => 
        newFilters.color!.some(color => 
          p.attributes?.color?.toLowerCase().includes(color.toLowerCase())
        )
      );
    }

    // Apply material filter
    if (newFilters.material && newFilters.material.length > 0) {
      filtered = filtered.filter(p => 
        newFilters.material!.some(material => 
          p.attributes?.material?.toLowerCase().includes(material.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (newFilters.sort) {
      switch (newFilters.sort) {
        case "price_asc":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "popularity":
          filtered.sort((a, b) => (b.attributes?.popularity_score || 0) - (a.attributes?.popularity_score || 0));
          break;
        case "newest":
          filtered.sort((a, b) => new Date(b.attributes?.created_at || 0).getTime() - new Date(a.attributes?.created_at || 0).getTime());
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setFilters({});
    setFilteredProducts(products);
  };

  return (
    <>
      {/* Filter trigger */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Filtre
          </Button>
          
          {Object.keys(filters).length > 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {filteredProducts.length} produse găsite
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sort || ""}
          onChange={(e) => applyFilters({ ...filters, sort: e.target.value })}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">Sortare implicită</option>
          <option value="price_asc">Preț crescător</option>
          <option value="price_desc">Preț descrescător</option>
          <option value="popularity">Cele mai populare</option>
          <option value="newest">Cele mai noi</option>
        </select>
      </div>

      {/* Products grid */}
      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} columns={3} />
      ) : (
        <EmptyState type="category" />
      )}

      {/* Filters modal */}
      <FullHeightFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        initial={filters}
        onApply={applyFilters}
        onReset={resetFilters}
      />
    </>
  );
}
