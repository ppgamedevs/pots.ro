import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supaPaginateRpc } from "@/lib/supabase-paginate-rpc";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const q = url.searchParams.get("q") || null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  try {
    const { items, meta } = await supaPaginateRpc(
      supabase,
      "rpc_products_active",               // numele funcției SQL
      { page: page || undefined, pageSize: pageSize || undefined, defaultPageSize: 24, maxPageSize: 60 },
      { search: q },                       // args către funcție
      { column: "created_at", ascending: false }
    );

    return NextResponse.json({ items, meta });
  } catch (error) {
    console.error("RPC search error:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
