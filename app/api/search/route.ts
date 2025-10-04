import { NextRequest, NextResponse } from "next/server";

const ELASTIC_URL = process.env.ELASTIC_URL!;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY!;
const INDEX = process.env.ELASTIC_INDEX || "products";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const from = Number(searchParams.get("from") || "0");
    const size = Number(searchParams.get("size") || "24");
    const sort = searchParams.get("sort") || "relevance";

    const sortClause =
      sort === "price_asc" ? [{ price: "asc" }] :
      sort === "price_desc" ? [{ price: "desc" }] :
      sort === "recent" ? [{ created_at: "desc" }] : ["_score"];

    const body = q
      ? {
          query: {
            multi_match: {
              query: q,
              fields: ["title^3", "seller^2", "category^1.5", "attributes.value"],
              type: "most_fields",
              operator: "and",
            },
          },
          sort: sortClause,
          from, 
          size,
          _source: ["id", "title", "price", "image", "seller", "category", "slug", "oldPrice", "badge"],
        }
      : {
          query: { match_all: {} },
          sort: sortClause,
          from, 
          size,
          _source: ["id", "title", "price", "image", "seller", "category", "slug", "oldPrice", "badge"],
        };

    // For MVP, return mock data if Elasticsearch is not configured
    if (!ELASTIC_URL || !ELASTIC_API_KEY) {
      const mockProducts = Array.from({ length: size }, (_, i) => ({
        id: `mock-${from + i}`,
        title: q ? `Produs ${i + 1} pentru "${q}"` : `Produs ${i + 1}`,
        price: Math.floor(Math.random() * 500) + 50,
        image: { src: "/placeholder.png", alt: `Produs ${i + 1}` },
        seller: `Vânzător ${i % 3 + 1}`,
        category: ["Ghivece", "Cutii", "Ambalaje"][i % 3],
        slug: `produs-${i + 1}`,
        oldPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 600) + 100 : undefined,
        badge: Math.random() > 0.8 ? "Reducere" : undefined,
      }));

      return NextResponse.json({ 
        items: mockProducts, 
        total: q ? 12 : 100 
      });
    }

    const response = await fetch(`${ELASTIC_URL}/${INDEX}/_search`, {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${ELASTIC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Elasticsearch error:", response.status, response.statusText);
      return NextResponse.json({ error: "search_failed" }, { status: 500 });
    }

    const data = await response.json();
    const items = data.hits.hits.map((h: any) => h._source);
    const total = data.hits.total?.value ?? items.length;

    return NextResponse.json({ items, total });

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}