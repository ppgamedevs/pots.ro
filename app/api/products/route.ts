import { NextResponse } from "next/server";
import { getPagination, buildPaginationMeta } from "@/lib/pagination";

// Mock data for demonstration
const mockProducts = Array.from({ length: 137 }, (_, i) => ({
  id: i + 1,
  title: `Produs ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 10,
  categorySlug: ["ghivece", "cutii", "accesorii"][i % 3],
  status: "active",
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");
    const categorySlug = url.searchParams.get("categorySlug");

    const calc = getPagination({ page, pageSize, maxPageSize: 60, defaultPageSize: 24 });

    // Filter products by category if specified
    let filteredProducts = mockProducts;
    if (categorySlug) {
      filteredProducts = mockProducts.filter(p => p.categorySlug === categorySlug);
    }

    // Apply pagination
    const startIndex = calc.offset;
    const endIndex = Math.min(calc.offset + calc.limit, filteredProducts.length);
    const items = filteredProducts.slice(startIndex, endIndex);

    const totalItems = filteredProducts.length;
    const meta = buildPaginationMeta(totalItems, calc);

    return NextResponse.json({ 
      items, 
      meta,
      success: true 
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

// Real Supabase implementation example:
/*
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");
    const categorySlug = url.searchParams.get("categorySlug");

    const calc = getPagination({ page, pageSize, maxPageSize: 60, defaultPageSize: 24 });

    // Build query
    let query = supabase
      .from("products_public_view")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(calc.offset, calc.offset + calc.limit - 1);

    if (categorySlug) {
      query = query.eq("category_slug", categorySlug);
    }

    const { data: items, count, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const totalItems = count ?? 0;
    const meta = buildPaginationMeta(totalItems, calc);

    return NextResponse.json({ 
      items: items ?? [], 
      meta,
      success: true 
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
*/
