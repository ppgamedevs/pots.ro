// Mock implementation - replace with actual Supabase client
// import { createClient } from "@supabase/supabase-js";
import { getPagination, getTotalPages } from "@/lib/pagination";

// Mock data for demonstration
const mockProducts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  slug: `product-${i + 1}`,
  title: `Produs ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 10,
  imageUrl: "/placeholder.svg",
  categorySlug: ["ghivece", "cutii", "accesorii"][i % 3],
  status: "active",
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
// );

export async function listPublicProducts(params: { 
  page?: number; 
  pageSize?: number; 
  categorySlug?: string 
}) {
  const { page = 1, pageSize = 24, categorySlug } = params;
  const pg = getPagination({ page, pageSize });

  // Mock implementation - replace with actual Supabase query
  let filteredProducts = mockProducts;
  
  if (categorySlug) {
    filteredProducts = mockProducts.filter(p => p.categorySlug === categorySlug);
  }

  // Simulate pagination
  const startIndex = pg.from;
  const endIndex = Math.min(pg.to + 1, filteredProducts.length);
  const items = filteredProducts.slice(startIndex, endIndex);
  
  const total = filteredProducts.length;

  return {
    items,
    page: pg.page,
    pageSize: pg.pageSize,
    total,
    totalPages: getTotalPages(total, pg.pageSize),
  };

  // Real Supabase implementation:
  // let q = supabase
  //   .from("products_public_view") // TIP: create a view with only public fields/status=active
  //   .select("*", { count: "exact" })
  //   .order("created_at", { ascending: false })
  //   .range(pg.from, pg.to);

  // if (categorySlug) q = q.eq("category_slug", categorySlug);

  // const { data, count, error } = await q;
  // if (error) throw error;

  // const total = count ?? 0;
  // return {
  //   items: data ?? [],
  //   page: pg.page,
  //   pageSize: pg.pageSize,
  //   total,
  //   totalPages: getTotalPages(total, pg.pageSize),
  // };
}
