import ProductGrid from "@/components/product/ProductGrid";
import SearchInline from "@/components/search/SearchInline";
import Link from "next/link";
import { headers } from "next/headers";

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

async function fetchProducts(baseUrl: string, q: string, page: number, sort: string) {
  const size = 24;
  const from = (page - 1) * size;
  
  try {
    const apiUrl = `${baseUrl}/api/search?q=${encodeURIComponent(q)}&from=${from}&size=${size}&sort=${encodeURIComponent(sort)}`;
    
    console.log(`[ProductsPage] Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl, { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[ProductsPage] Search API error: ${response.status} ${response.statusText}`);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[ProductsPage] ✅ Fetched ${data.items?.length || 0} items (total: ${data.total || 0})`);
    return data;
  } catch (error) {
    console.error("[ProductsPage] ❌ Error fetching products:", error);
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
  
  // Get base URL from request headers
  const headersList = headers();
  const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headersList.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  const { items = [], total = 0 } = await fetchProducts(baseUrl, q, page, sort);
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
