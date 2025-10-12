import { NextResponse } from "next/server";
// import { mockProductsByCategory } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export const dynamic = 'force-static';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(_req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 24), 48);
  const cursor = url.searchParams.get("cursor"); // base64 id sau index

  // Mock data for now
  const mockProductsByCategory: Record<string, any[]> = {
    vaze: [
      {
        id: "1",
        title: "Vază ceramică - Natur",
        price: 129.0,
        currency: "RON",
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"],
        seller: { id: "seller1", name: "Atelier Ceramic", slug: "atelier-ceramic" },
        category: { id: "cat1", name: "Vaze", slug: "vaze" },
        status: "active",
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-15T12:00:00Z",
      }
    ]
  };

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
