import ProductGrid from "@/components/product/ProductGrid";
import SearchInline from "@/components/search/SearchInline";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  title: string;
  price: number;
  image?: {
    src: string;
    alt: string;
  };
  seller: string;
  category: string;
  slug: string;
  oldPrice?: number;
  badge?: string;
}

async function fetchProducts(q: string, page: number, sort: string) {
  const size = 24;
  const from = (page - 1) * size;
  
  try {
    const url = new URL("/api/search", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    url.searchParams.set("q", q);
    url.searchParams.set("from", from.toString());
    url.searchParams.set("size", size.toString());
    url.searchParams.set("sort", sort);

    const response = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return { items: [], total: 0 };
  }
}

function Pagination({ 
  currentPage, 
  totalPages, 
  query, 
  sort 
}: { 
  currentPage: number; 
  totalPages: number; 
  query: string; 
  sort: string; 
}) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "relevance") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  return (
    <nav className="flex justify-center items-center gap-2 mt-10">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="btn-ghost"
        >
          <span className="i-lucide:chevron-left h-4 w-4" />
          Anterior
        </Link>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          if (page > totalPages) return null;
          
          return (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={`px-3 py-2 rounded-lg text-sm transition-micro ${
                page === currentPage
                  ? "bg-primary text-white"
                  : "text-ink hover:bg-bg-soft"
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="btn-ghost"
        >
          Următor
          <span className="i-lucide:chevron-right h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams: { q?: string; page?: string; sort?: string } 
}) {
  const q = searchParams.q || "";
  const page = Number(searchParams.page || "1");
  const sort = searchParams.sort || "relevance";
  
  const { items = [], total = 0 } = await fetchProducts(q, page, sort);
  const totalPages = Math.ceil(total / 24);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Produse</h1>
        {q && (
          <p className="text-subink mt-1">
            Rezultate pentru "{q}" - {total} produse găsite
          </p>
        )}
        {!q && (
          <p className="text-subink mt-1">
            Descoperă toate produsele din marketplace
          </p>
        )}
      </div>

      <div className="mb-6">
        <SearchInline defaultQuery={q} defaultSort={sort} />
      </div>

      <ProductGrid items={items} />

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        query={q}
        sort={sort}
      />
    </main>
  );
}
