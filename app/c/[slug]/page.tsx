import { listPublicProducts } from "@/lib/data/products";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductGrid } from "@/components/ui/product-grid";
import { H1, P } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";

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
  const page = Number(searchParams.page ?? 1);
  const pageSize = Number(searchParams.pageSize ?? 24);

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

  // Fetch products with server-side pagination
  const { items, totalPages, total } = await listPublicProducts({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 24,
    categorySlug: params.slug,
  });

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
            <H1>{category.title}</H1>
            <P className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
              {category.description}
            </P>
          </div>

          {/* Products Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {total} produse găsite
              </p>
            </div>

            {items.length > 0 ? (
              <>
                <ProductGrid products={items} columns={4} />
                <Pagination
                  totalPages={totalPages}
                  currentPage={page}
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
}