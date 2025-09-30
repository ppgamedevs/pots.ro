import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, sellers } from "@/db/schema/core";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { searchSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const { q } = searchSchema.parse({ q: query });

    // Search products using full-text search
    const productResults = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        description: products.description,
        priceCents: products.priceCents,
        currency: products.currency,
        imageUrl: products.imageUrl,
        sellerId: products.sellerId,
      })
      .from(products)
      .where(and(
        eq(products.status, 'active'),
        sql`${products.searchTsv} @@ websearch_to_tsquery('simple', ${q})`
      ))
      .limit(8);

    // Search categories
    const categoryResults = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(or(
        ilike(categories.name, `%${q}%`),
        ilike(categories.slug, `%${q}%`)
      ))
      .limit(5);

    // Search sellers
    const sellerResults = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
      })
      .from(sellers)
      .where(or(
        ilike(sellers.brandName, `%${q}%`),
        ilike(sellers.slug, `%${q}%`)
      ))
      .limit(5);

    return NextResponse.json({
      products: productResults,
      categories: categoryResults,
      sellers: sellerResults,
    });

  } catch (error) {
    console.error("Search API error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid query parameter" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
