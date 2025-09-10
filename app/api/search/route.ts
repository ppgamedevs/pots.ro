import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ products: [], categories: [], sellers: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // route handler = server only
  );

  // NOTE: ajustează după schema ta (coloane, tabele, index FTS)
  const [productsRes, categoriesRes, sellersRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, title, price, currency, image_url, seller_slug")
      .eq("status", "active")
      .textSearch("search_tsv", q, { type: "websearch" } as any)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("categories")
      .select("slug, name")
      .textSearch("search_tsv", q, { type: "websearch" } as any)
      .limit(5),
    supabase
      .from("sellers")
      .select("slug, brand_name")
      .textSearch("search_tsv", q, { type: "websearch" } as any)
      .limit(5),
  ]);

  if (productsRes.error || categoriesRes.error || sellersRes.error) {
    console.error(productsRes.error || categoriesRes.error || sellersRes.error);
    return NextResponse.json({ products: [], categories: [], sellers: [] }, { status: 200 });
  }

  return NextResponse.json({
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    sellers: sellersRes.data ?? [],
  });
}
