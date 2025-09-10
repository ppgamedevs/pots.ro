import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FiltersTrigger } from "./filters-trigger";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductGrid } from "@/components/ui/product-grid";
import { H1, P } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { getPagination, buildPaginationMeta } from "@/lib/pagination";

// Category metadata
const categoryMetadata = {
  "ghivece": {
    title: "Ghivece",
    description: "Ghivece de calitate pentru toate tipurile de plante. Materiale durabile și design modern.",
  },
  "cutii": {
    title: "Cutii",
    description: "Cutii elegante pentru aranjamente florale și cadouri. Design clasic și modern.",
  },
  "accesorii": {
    title: "Accesorii",
    description: "Accesorii esențiale pentru aranjamente florale. Panglici, vaze, suporturi și multe altele.",
  }
};

export default async function CategoryPage({ 
  params, 
  searchParams 
}: { 
  params: { slug: string }; 
  searchParams: Record<string, string> 
}) {
  const calc = getPagination({ 
    page: searchParams?.page, 
    pageSize: searchParams?.pageSize,
    maxPageSize: 60,
    defaultPageSize: 24
  });

  // Get category metadata
  const category = categoryMetadata[params.slug as keyof typeof categoryMetadata];
  
  if (!category) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <EmptyState
            variant="category"
            title="Categorie nu există"
            description="Categoria pe care o căutați nu există sau a fost mutată."
            action={{
              label: "Vezi toate categoriile",
              onClick: () => window.location.href = "/",
            }}
          />
        </main>
        <Footer />
      </>
    );
  }

  // Fetch products from API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = new URL('/api/products', baseUrl);
  apiUrl.searchParams.set('categorySlug', params.slug);
  apiUrl.searchParams.set('page', calc.page.toString());
  apiUrl.searchParams.set('pageSize', calc.pageSize.toString());

  try {
    const response = await fetch(apiUrl.toString(), { 
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data = await response.json();
    const { items, meta } = data;

    const breadcrumbItems = [
      { label: "Acasă", href: "/" },
      { label: "Categorii", href: "/c" },
      { label: category.title },
    ];

    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="space-y-8">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <H1>{category.title}</H1>
                  <P className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
                    {category.description}
                  </P>
                </div>
                <FiltersTrigger />
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {meta.totalItems} produse găsite
                </p>
              </div>

              {items.length > 0 ? (
                <>
                  <ProductGrid products={items} columns={4} />
                  <Pagination
                    totalPages={meta.totalPages}
                    currentPage={meta.page}
                    ariaLabel="Paginare produse"
                  />
                </>
              ) : (
                <EmptyState
                  variant="search"
                  title="Nu am găsit produse"
                  description="Încearcă să modifici filtrele pentru a vedea mai multe rezultate."
                  action={{
                    label: "Vezi toate produsele",
                    onClick: () => window.location.href = "/",
                  }}
                />
              )}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );

  } catch (error) {
    console.error('Error fetching products:', error);
    
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <EmptyState
            variant="search"
            title="Eroare la încărcare"
            description="A apărut o eroare la încărcarea produselor. Vă rugăm să încercați din nou."
            action={{
              label: "Reîncarcă pagina",
              onClick: () => window.location.reload(),
            }}
          />
        </main>
        <Footer />
      </>
    );
  }
}