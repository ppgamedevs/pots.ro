import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, sellers } from "@/db/schema/core";
import { eq, and, ilike, or } from "drizzle-orm";

const ELASTIC_URL = process.env.ELASTIC_URL!;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY!;
const INDEX = process.env.ELASTIC_INDEX || "products";

export async function GET(req: NextRequest) {
  try {
    const q = (new URL(req.url)).searchParams.get("q")?.trim() || "";
    
    if (!q) {
      return NextResponse.json({ suggestions: [] });
    }

    // For MVP, return real products from database if Elasticsearch is not configured
    if (!ELASTIC_URL || !ELASTIC_API_KEY) {
      // Search for products matching the query
      const results = await db
        .select({
          product: products,
          seller: sellers,
        })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .where(
          and(
            eq(products.status, 'active'),
            or(
              ilike(products.title, `%${q}%`),
              ilike(products.description, `%${q}%`)
            )!
          )
        )
        .limit(6);

      type ResultType = typeof results[0];
      const suggestions = results.map(({ product, seller }: ResultType) => ({
        title: product.title,
        slug: product.slug,
      }));

      return NextResponse.json({ suggestions });
    }

    const body = {
      suggest: {
        product_suggest: {
          prefix: q,
          completion: { 
            field: "suggest", 
            fuzzy: { fuzziness: 1 }, 
            size: 6 
          }
        }
      },
      _source: ["title", "slug"]
    };

    const response = await fetch(`${ELASTIC_URL}/${INDEX}/_search`, {
      method: "POST",
      headers: { 
        Authorization: `ApiKey ${ELASTIC_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Elasticsearch suggest error:", response.status, response.statusText);
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    const suggestions = (data.suggest?.product_suggest?.[0]?.options || [])
      .map((o: any) => ({ 
        title: o._source?.title, 
        slug: o._source?.slug 
      }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Suggest API error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
