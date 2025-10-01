import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, sellers } from "@/db/schema/core";
import { sql, ilike, or, and, eq, desc } from "drizzle-orm";
import { searchSchema } from "@/lib/validations";
import { getPagination, buildPaginationMeta } from "@/lib/pagination";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const page = searchParams.get('page');
    
    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const { q } = searchSchema.parse({ q: query });
    const { offset, limit, meta } = getPagination({ page: page || undefined, pageSize: 24 });

    // Build base condition
    let baseCondition;
    if (category) {
      baseCondition = and(eq(products.status, 'active'), eq(products.categoryId, category));
    } else {
      baseCondition = eq(products.status, 'active');
    }

    // Try FTS first
    let productResults = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        description: products.description,
        priceCents: products.priceCents,
        currency: products.currency,
        imageUrl: products.imageUrl,
        sellerId: products.sellerId,
        score: sql<number>`ts_rank(${products.searchTsv}, websearch_to_tsquery('simple', ${q}))`,
      })
      .from(products)
      .where(and(
        baseCondition,
        sql`${products.searchTsv} @@ websearch_to_tsquery('simple', ${q})`
      ))
      .orderBy(desc(sql`ts_rank(${products.searchTsv}, websearch_to_tsquery('simple', ${q}))`))
      .limit(limit)
      .offset(offset);

    // If no FTS results, try trigram fallback
    if (productResults.length === 0) {
      productResults = await db
        .select({
          id: products.id,
          slug: products.slug,
          title: products.title,
          description: products.description,
          priceCents: products.priceCents,
          currency: products.currency,
          imageUrl: products.imageUrl,
          sellerId: products.sellerId,
          score: sql<number>`similarity(${products.title}, ${q})`,
        })
        .from(products)
        .where(and(
          baseCondition,
          sql`similarity(${products.title}, ${q}) > 0.1`
        ))
        .orderBy(desc(sql`similarity(${products.title}, ${q})`))
        .limit(limit)
        .offset(offset);
    }

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(baseCondition);

    const totalItems = totalCount[0]?.count || 0;
    const paginationMeta = buildPaginationMeta(meta.page, meta.pageSize, totalItems);

    return NextResponse.json({
      items: productResults,
      meta: paginationMeta,
    });

  } catch (error) {
    console.error("Search API error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid query parameter" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}