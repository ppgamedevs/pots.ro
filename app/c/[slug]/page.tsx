import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FiltersTrigger } from "./filters-trigger";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductGrid } from "@/components/ui/product-grid";
import { H1, P } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryPageSkeleton } from "@/components/ui/loading-skeletons";
import { CategoryErrorState } from "@/components/ui/error-states";
import { getPagination, buildPaginationMeta } from "@/lib/pagination";
import { Suspense } from "react";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";

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

// Generate metadata for SEO
export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: { slug: string }; 
  searchParams: Record<string, string> 
}): Promise<Metadata> {
  const category = categoryMetadata[params.slug as keyof typeof categoryMetadata];

  if (!category) {
    return {
      title: "Categorie nu există | Pots.ro",
      description: "Categoria căutată nu a fost găsită pe Pots.ro",
    };
  }

  const page = searchParams?.page ? ` - Pagina ${searchParams.page}` : "";
  const title = `${category.title}${page} | Pots.ro`;
  const description = `${category.description} Descoperă o gamă largă de ${category.title.toLowerCase()} de calitate. Livrare rapidă în toată România.`;

  // Build canonical URL
  const baseUrl = "https://pots.ro";
  const canonicalParams = new URLSearchParams();
  if (searchParams?.page) canonicalParams.set("page", searchParams.page);
  if (searchParams?.sort) canonicalParams.set("sort", searchParams.sort);
  if (searchParams?.filter) canonicalParams.set("filter", searchParams.filter);
  
  const canonicalUrl = `${baseUrl}/c/${params.slug}${canonicalParams.toString() ? `?${canonicalParams.toString()}` : ""}`;

  return {
    title,
    description,
    keywords: [
      category.title.toLowerCase(),
      "floristică",
      "pots.ro",
      "ghivece",
      "cutii",
      "accesorii",
      "plante",
      "aranjamente florale"
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "Pots.ro",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Cached function for category data
const getCachedCategoryData = unstable_cache(
  async (slug: string, page: number, pageSize: number) => {
    // Mock data - in production, fetch from database
    const category = categoryMetadata[slug as keyof typeof categoryMetadata];
    if (!category) {
      return { category: null, products: [], totalCount: 0 };
    }

    // Mock products for the category
    const mockProducts = Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      title: `${category.title} ${i + 1}`,
      price: 50 + Math.random() * 200,
      currency: "RON",
      imageUrl: `https://images.unsplash.com/photo-${1578662996442 + i}?w=400&h=400&fit=crop&crop=center`,
      sellerSlug: `seller-${i % 3 + 1}`,
      slug: `${slug}-${i + 1}`,
    }));

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const products = mockProducts.slice(startIndex, endIndex);

    return {
      category,
      products,
      totalCount: mockProducts.length,
    };
  },
  ['category-data'],
  {
    tags: ['categories', 'products'],
    revalidate: 1800, // 30 minutes
  }
);

// ISR Configuration
export const revalidate = 1800; // 30 minutes for categories

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

  // Get cached category data
  const { category, products, totalCount } = await getCachedCategoryData(
    params.slug,
    calc.page,
    calc.limit
  );
  
  if (!category) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <CategoryErrorState slug={params.slug} />
        </main>
        <Footer />
      </>
    );
  }

  // Products are already fetched from cache
  const items = products;
  const meta = buildPaginationMeta(totalCount, calc);

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
}