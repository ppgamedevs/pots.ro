import type { Category, ProductCard, SellerPublic, Product, CategoryProductsResponse } from "./types";

const base = "";

export async function apiGetCategories(): Promise<Category[]> {
  const r = await fetch(`${base}/api/categories`, { next: { revalidate: 1800 } });
  if (!r.ok) throw new Error("Failed categories");
  return r.json();
}

export async function apiGetCategoryProducts(
  slug: string, 
  limit = 24, 
  cursor?: string
): Promise<CategoryProductsResponse> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (cursor) q.set("cursor", cursor);
  const r = await fetch(`${base}/api/categories/${slug}/products?${q.toString()}`, { 
    next: { revalidate: 1800 } 
  });
  if (r.status === 404) throw new Error("Category not found");
  if (!r.ok) throw new Error("Failed products");
  return r.json();
}

export async function apiGetProductById(id: number): Promise<Product> {
  const r = await fetch(`${base}/api/products/${id}`, { 
    next: { revalidate: 1800 } 
  });
  if (r.status === 404) throw new Error("Product not found");
  if (!r.ok) throw new Error("Failed product");
  return r.json();
}

export async function apiGetSeller(slug: string): Promise<SellerPublic> {
  const r = await fetch(`${base}/api/sellers/${slug}`, { 
    next: { revalidate: 1800 } 
  });
  if (r.status === 404) throw new Error("Seller not found");
  if (!r.ok) throw new Error("Failed seller");
  return r.json();
}
