import { NextResponse } from "next/server";
import { mockSellerProducts, mockCategories } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";
import type { SellerProductsResponse, SellerProductListItem } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const q = url.searchParams.get("q") || "";
  const inStock = url.searchParams.get("inStock") || "";
  const sort = url.searchParams.get("sort") || "updated_desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "10"), 50);

  // Convert mock data to list format
  let products: SellerProductListItem[] = Object.values(mockSellerProducts).map(product => ({
    id: product.id!,
    title: product.title,
    price: product.price,
    currency: product.currency,
    image: product.images[0]?.url || "/placeholder.png",
    status: product.status,
    stockQty: product.stockQty,
    categorySlug: product.categorySlug,
    updatedAt: product.updatedAt || product.createdAt || new Date().toISOString()
  }));

  // Apply filters
  if (status && status !== "all") {
    products = products.filter(p => p.status === status);
  }

  if (inStock === "yes") {
    products = products.filter(p => p.stockQty > 0);
  } else if (inStock === "no") {
    products = products.filter(p => p.stockQty === 0);
  }

  if (q) {
    const searchTerm = q.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(searchTerm)
    );
  }

  // Apply sorting
  switch (sort) {
    case "price_asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "created_desc":
      products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case "updated_desc":
    default:
      products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
  }

  // Apply pagination
  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = products.slice(startIndex, endIndex);

  const response: SellerProductsResponse = {
    items: paginatedProducts,
    total,
    page,
    pageSize,
    totalPages
  };

  return NextResponse.json(response, { headers: { ...cacheHeaders } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate new ID
    const newId = Math.max(...Object.keys(mockSellerProducts).map(Number)) + 1;
    
    const newProduct = {
      ...body,
      id: newId,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real app, this would save to database
    mockSellerProducts[newId] = newProduct;

    return NextResponse.json(newProduct, { 
      status: 201,
      headers: { ...cacheHeaders } 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
