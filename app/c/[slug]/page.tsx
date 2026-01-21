"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { generateCategoryLDJSON } from "@/lib/seo/meta-catalog";
import { CategoryHeader } from "@/components/catalog/CategoryHeader";
import { FiltersBar } from "@/components/catalog/FiltersBar";
import { SortDropdown } from "@/components/catalog/SortDropdown";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";
import { CategoryHeaderSkeleton, FiltersBarSkeleton, ProductGridSkeleton } from "@/components/common/Skeletons";

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
  stock?: number; // Stock quantity
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

interface Facet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options: {
    value: string;
    label: string;
    count: number;
  }[];
}

interface CategoryResponse {
  items: Product[];
  total: number;
  facets: Facet[];
  currentPage: number;
  totalPages: number;
  redirectTo?: string;
}

const sortOptions = [
  { label: 'Relevanță', value: 'relevance' },
  { label: 'Preț crescător', value: 'price_asc' },
  { label: 'Preț descrescător', value: 'price_desc' },
  { label: 'Noutăți', value: 'newest' },
  { label: 'Rating', value: 'rating' }
];

export default function Category() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('relevance');

  // Get category info
  const getCategoryInfo = (slug: string) => {
    const categories: Record<string, { title: string; subtitle: string; image?: string }> = {
      'ghivece': {
        title: 'Ghivece',
        subtitle: 'Descoperă o gamă variată de ghivece pentru plante, de la modele moderne la clasice, perfecte pentru orice stil de decor.',
        image: '/placeholder.svg'
      },
      'cutii': {
        title: 'Cutii',
        subtitle: 'Cutii elegante pentru aranjamente florale, cadouri sau decor. Materiale naturale și designuri rafinate.',
        image: '/images/cutii-elegante-rosii.jpg'
      },
      'accesorii': {
        title: 'Accesorii',
        subtitle: 'Toate accesoriile necesare pentru grădinărit și aranjamente florale. Unelte, panglici și multe altele.',
        image: '/placeholder.svg'
      },
      'ambalaje': {
        title: 'Ambalaje',
        subtitle: 'Ambalaje eco-friendly pentru flori și cadouri. Materiale reciclabile și designuri moderne.',
        image: '/placeholder.svg'
      }
    };
    
    return categories[slug] || {
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
      subtitle: 'Descoperă produsele din această categorie'
    };
  };

  // Extract stable values from searchParams to prevent infinite loops
  // Browser extensions (e.g., SetIcon) can cause DOM mutations that trigger React re-renders,
  // which creates a new searchParams object reference even if values haven't changed.
  const pageParam = searchParams.get('page') || '1';
  const sortParam = searchParams.get('sort') || 'relevance';
  const filtersParam = searchParams.get('filters') || '{}';

  useEffect(() => {
    // Guard: Prevent fetch if already loading or if slug is empty
    if (!categorySlug) return;

    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        setSortBy(sortParam);
        setSelectedFilters(JSON.parse(filtersParam));
        
        const response = await fetch(
          `/api/catalog/category?slug=${categorySlug}&page=${pageParam}&sort=${sortParam}&filters=${encodeURIComponent(filtersParam)}`
        );
        
        if (!response.ok) {
          throw new Error('Categoria nu a fost găsită');
        }
        
        const data = (await response.json()) as CategoryResponse;

        if (data?.redirectTo) {
          const qs = typeof window !== 'undefined' ? window.location.search : '';
          router.replace(`/c/${data.redirectTo}${qs}`);
          return;
        }

        setCategoryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la încărcarea categoriei');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
    // Dependencies: Use stable primitive values instead of searchParams object
    // This prevents re-fetching when browser extensions cause DOM mutations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, pageParam, sortParam, filtersParam]);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('filters', JSON.stringify(filters));
    newSearchParams.set('page', '1'); // Reset to first page
    window.history.pushState(null, '', `?${newSearchParams.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('sort', sort);
    newSearchParams.set('page', '1'); // Reset to first page
    window.history.pushState(null, '', `?${newSearchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    window.history.pushState(null, '', `?${newSearchParams.toString()}`);
  };


  const categoryInfo = getCategoryInfo(categorySlug);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg">
        <CategoryHeaderSkeleton />
        <FiltersBarSkeleton />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductGridSkeleton count={12} />
        </div>
      </main>
    );
  }

  if (error || !categoryData) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink mb-2">Categoria nu a fost găsită</h1>
          <p className="text-muted mb-4">Categoria pe care o căutați nu există.</p>
          <a href="/" className="text-primary hover:text-primary/80">
            Înapoi la homepage
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* LD+JSON */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCategoryLDJSON(categoryInfo, categoryData.total))
        }}
      />
      
      <main className="min-h-screen bg-bg">
        {/* Category Header */}
        <CategoryHeader
          title={categoryInfo.title}
          subtitle={categoryInfo.subtitle}
          image={categoryInfo.image ? { src: categoryInfo.image, alt: categoryInfo.title } : undefined}
          productCount={categoryData.total}
        />

        {/* Filters Bar */}
        <FiltersBar
          facets={categoryData.facets}
          selected={selectedFilters}
          onChange={handleFilterChange}
        />

        {/* Controls */}
        <div className="bg-bg border-b border-line">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results Count */}
              <div className="text-sm text-muted">
                {categoryData.total} produse găsite
              </div>

              {/* Sort Dropdown */}
              <SortDropdown
                value={sortBy}
                onChange={handleSortChange}
                options={sortOptions}
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {categoryData.items.length > 0 ? (
            <>
              <ProductGrid items={categoryData.items.map(item => ({
                id: item.id,
                image: item.images[0],
                title: item.title,
                seller: item.seller.name,
                price: item.price,
                oldPrice: item.oldPrice,
                badge: item.badges?.[0] as 'nou' | 'reducere' | 'stoc redus' | undefined,
                href: `/p/${item.slug}`,
                stockQty: item.stock ?? 10 // Use real stock or default to 10
              }))} />
              
              {/* Pagination */}
              <Pagination
                page={categoryData.currentPage}
                totalPages={categoryData.totalPages}
                onPageChange={handlePageChange}
                totalItems={categoryData.total}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-ink mb-2">
                Nu am găsit rezultate
              </h3>
              <p className="text-muted mb-4">
                Încearcă să ajustezi filtrele sau să cauți altceva.
              </p>
              <button
                onClick={() => {
                  setSelectedFilters({});
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.delete('filters');
                  window.history.pushState(null, '', `?${newSearchParams.toString()}`);
                }}
                className="text-primary hover:text-primary/80"
              >
                Șterge toate filtrele
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}