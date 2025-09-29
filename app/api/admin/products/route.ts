import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supaPaginate } from "@/lib/supabase-paginate";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // route handler securizat (server-only)
  );

  try {
    const { items, meta } = await supaPaginate(
      supabase,
      "products",
      { page, pageSize, maxPageSize: 100, defaultPageSize: 20 },
      (s) => {
        let query = s.eq("status", status || "active");
        
        if (q) {
          // exemplu FTS simplu - adaptează la schema ta
          query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
        }
        
        return query;
      },
      { column: "created_at", ascending: false },
      "id, title, price, currency, stock, status, seller_id, created_at, updated_at, sellers!inner (slug, brand_name)"
    );

    return NextResponse.json({ items, meta });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
