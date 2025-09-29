import { NextResponse } from "next/server";
import { mockProductsByCategory } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(_req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 24), 48);
  const cursor = url.searchParams.get("cursor"); // base64 id sau index

  const all = mockProductsByCategory[slug] || [];
  if (!mockProductsByCategory[slug]) {
    // categorie neexistentă -> 404
    return new NextResponse("Not Found", { status: 404 });
  }

  // cursor simplu bazat pe index (înlocuiește ulterior cu created_at/id)
  const startIndex = cursor ? Number(Buffer.from(cursor, "base64").toString("utf8")) : 0;
  const items = all.slice(startIndex, startIndex + limit);

  const nextIndex = startIndex + items.length;
  const nextCursor = nextIndex < all.length ? Buffer.from(String(nextIndex)).toString("base64") : undefined;

  return NextResponse.json(
    { items, nextCursor },
    { headers: { ...cacheHeaders } }
  );
}
