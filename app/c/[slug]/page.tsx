import { notFound } from "next/navigation";
import { apiGetCategoryProducts, apiGetCategories } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { H1, P } from "@/components/ui/typography";
import CategoryFiltersClient from "./filters-trigger";

async function getCategory(slug: string) {
  try {
    const categories = await apiGetCategories();
    const category = categories.find(c => c.slug === slug);
    
    if (!category) return null;
    
    return {
      name: category.name,
      description: `Produse din categoria ${category.name} - calitate superioară pentru floristică`,
    };
  } catch (error) {
    return null;
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategory(params.slug);
  if (!category) return notFound();

  let products: any[] = [];
  try {
    const response = await apiGetCategoryProducts(params.slug);
    products = response.items;
  } catch (error) {
    // Category not found or error - products will be empty array
    products = [];
  }
  
  // Convert products for ProductGrid
  const gridProducts = products.map(product => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price * 100, // Convert to cents for compatibility
    currency: product.currency,
    imageUrl: product.image,
    sellerSlug: product.sellerSlug,
    attributes: {
      price_cents: product.price * 100,
      stock_qty: 10, // Default stock
      is_in_stock: true,
      vendor_id: 1,
      material: "ceramic" as const,
      color: "natural" as const,
      shape: "round" as const,
      style: "modern" as const,
      finish: "matte" as const,
      diameter_mm: 200,
      height_mm: 150,
      length_mm: 200,
      personalizable: false,
      painted: false,
      tags: ["ceramic", "natural", "modern"],
      ribbon_included: false,
      compatibility: ["bouquet", "box"],
      pack_units: 1,
      food_safe: false,
      created_at: new Date().toISOString(),
      popularity_score: 850,
    }
  }));

  const breadcrumbItems = [
    { name: "Categorii", href: "/c" },
    { name: category.name, href: `/c/${params.slug}` },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          {/* Category header */}
          <div className="mb-8">
            <H1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {category.name}
            </H1>
            <P className="text-slate-600 dark:text-slate-400 text-lg">
              {category.description}
            </P>
          </div>

          {/* Filters and Products */}
          <CategoryFiltersClient 
            products={gridProducts} 
            categorySlug={params.slug} 
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
