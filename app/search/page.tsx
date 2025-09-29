"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductGrid } from "@/components/ui/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { ProductCard } from "@/lib/types";

// Mock search results
const mockSearchResults: ProductCard[] = [
  {
    id: 1,
    slug: "ghiveci-ceramic-alb",
    title: "Ghiveci ceramic alb",
    price: 49.9,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "atelier-ceramic"
  },
  {
    id: 2,
    slug: "cutie-inalta-nevopsita",
    title: "Cutie înaltă natur",
    price: 79.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "cardboard-street"
  },
  {
    id: 3,
    slug: "panglica-satin",
    title: "Panglică satin 25mm",
    price: 14.5,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "accesorii-florale"
  },
  {
    id: 4,
    slug: "vaza-ceramica-natur",
    title: "Vază ceramică natur",
    price: 129.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "atelier-ceramic"
  },
  {
    id: 5,
    slug: "ghiveci-rotund-natur",
    title: "Ghiveci rotund natur",
    price: 89.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "atelier-ceramic"
  },
  {
    id: 6,
    slug: "set-3-vaze-ceramica",
    title: "Set 3 vaze ceramică",
    price: 299.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    sellerSlug: "atelier-ceramic"
  }
];

const categories = [
  { value: "all", label: "Toate categoriile" },
  { value: "vaze", label: "Vaze" },
  { value: "ghivece", label: "Ghivece" },
  { value: "cutii", label: "Cutii" },
  { value: "accesorii", label: "Accesorii" },
  { value: "ceramica", label: "Ceramică" }
];

const priceRanges = [
  { value: "all", label: "Toate prețurile" },
  { value: "0-50", label: "Sub 50 RON" },
  { value: "50-100", label: "50 - 100 RON" },
  { value: "100-200", label: "100 - 200 RON" },
  { value: "200+", label: "Peste 200 RON" }
];

const sortOptions = [
  { value: "relevance", label: "Relevanță" },
  { value: "price_asc", label: "Preț crescător" },
  { value: "price_desc", label: "Preț descrescător" },
  { value: "newest", label: "Cele mai noi" }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebouncedValue(query, 300);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let results = [...mockSearchResults];

    // Search filter
    if (debouncedQuery) {
      const searchTerm = debouncedQuery.toLowerCase();
      results = results.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.slug.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (category !== "all") {
      // In a real app, this would filter by actual category
      results = results.filter(product => 
        product.slug.includes(category) || 
        product.title.toLowerCase().includes(category)
      );
    }

    // Price filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      results = results.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        } else {
          return product.price >= min;
        }
      });
    }

    // Sort
    switch (sort) {
      case "price_asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        results.sort((a, b) => b.id - a.id);
        break;
      case "relevance":
      default:
        // Simple relevance: exact matches first, then partial matches
        if (debouncedQuery) {
          results.sort((a, b) => {
            const aExact = a.title.toLowerCase().includes(debouncedQuery.toLowerCase());
            const bExact = b.title.toLowerCase().includes(debouncedQuery.toLowerCase());
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
          });
        }
        break;
    }

    return results;
  }, [debouncedQuery, category, priceRange, sort]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (category !== "all") params.set("category", category);
    if (priceRange !== "all") params.set("price", priceRange);
    if (sort !== "relevance") params.set("sort", sort);

    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, category, priceRange, sort, router]);

  // Highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const hasActiveFilters = category !== "all" || priceRange !== "all" || sort !== "relevance";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi
            </Button>
            
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Caută produse, categorii, vânzători..."
                  className="pl-10 pr-4"
                  autoFocus
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtre
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {[category !== "all", priceRange !== "all", sort !== "relevance"].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Filtre
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Categorie
                </label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Preț
                </label>
                <Select
                  value={priceRange}
                  onValueChange={setPriceRange}
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sortează
                </label>
                <Select
                  value={sort}
                  onValueChange={setSort}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategory("all");
                    setPriceRange("all");
                    setSort("relevance");
                  }}
                  className="w-full"
                >
                  Resetează filtrele
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {debouncedQuery ? (
                  <>
                    Rezultate pentru "{debouncedQuery}"
                  </>
                ) : (
                  "Căutare produse"
                )}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                {filteredResults.length} produs{filteredResults.length !== 1 ? "e" : ""} găsit{filteredResults.length !== 1 ? "e" : ""}
                {hasActiveFilters && " cu filtrele aplicate"}
              </p>
            </div>

            {/* Results Grid */}
            {filteredResults.length === 0 ? (
              <EmptyState
                variant="search"
                title={debouncedQuery ? "Nu am găsit rezultate" : "Caută produse"}
                description={
                  debouncedQuery 
                    ? `Nu am găsit produse pentru "${debouncedQuery}". Încearcă alți termeni de căutare.`
                    : "Introdu un termen de căutare pentru a găsi produse."
                }
                action={{
                  label: "Vezi toate produsele",
                  onClick: () => window.location.href = "/"
                }}
              />
            ) : (
              <ProductGrid
                products={filteredResults.map(product => ({
                  ...product,
                  title: highlightText(product.title, debouncedQuery) as any,
                  imageUrl: product.image
                }))}
                columns={3}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
