import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers, categories } from "@/db/schema/core";
import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

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

    console.log('[Search API] Request:', { q, from, size, sort, hasElastic: !!(ELASTIC_URL && ELASTIC_API_KEY) });

    // If Elasticsearch is not configured, use database search
    if (!ELASTIC_URL || !ELASTIC_API_KEY) {
      // Build search conditions
      const conditions = [eq(products.status, 'active')];
      
      if (q) {
        // Use case-insensitive search with ILIKE
        const searchTerm = `%${q}%`;
        conditions.push(
          or(
            ilike(products.title, searchTerm),
            ilike(products.description, searchTerm)
          )!
        );
      }

      // Build order by clause
      let orderByClause;
      if (sort === "price_asc") {
        orderByClause = asc(products.priceCents);
      } else if (sort === "price_desc") {
        orderByClause = desc(products.priceCents);
      } else if (sort === "recent") {
        orderByClause = desc(products.createdAt);
      } else {
        orderByClause = desc(products.createdAt);
      }

      // Get total count
      let total = 0;
      try {
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(and(...conditions));
        total = Number(totalResult[0]?.count || 0);
        console.log('[Search API] Total products found:', total);
      } catch (countError) {
        console.error('[Search API] Error counting products:', countError);
        total = 0;
      }

      // Fetch products
      console.log('[Search API] Fetching products with conditions:', {
        q,
        conditionsCount: conditions.length,
        size,
        from
      });
      
      let result;
      try {
        // First check if we have any active products at all
        const activeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.status, 'active'));
        console.log('[Search API] Total active products in DB:', Number(activeCount[0]?.count || 0));
        
        result = await db
          .select({
            product: products,
            seller: sellers,
            category: categories,
          })
          .from(products)
          .innerJoin(sellers, eq(products.sellerId, sellers.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions))
          .orderBy(orderByClause)
          .limit(size)
          .offset(from);
        
        console.log('[Search API] Products fetched after join:', result.length);
        if (result.length === 0 && q) {
          // Try to find products without seller join to see if they exist
          const productsOnly = await db
            .select()
            .from(products)
            .where(and(...conditions))
            .limit(5);
          console.log('[Search API] Products found without seller join:', productsOnly.length);
        }
      } catch (queryError: any) {
        console.error('[Search API] Error fetching products:', queryError);
        console.error('[Search API] Error details:', {
          message: queryError?.message,
          stack: queryError?.stack,
        });
        return NextResponse.json({ 
          error: "Failed to search products",
          details: process.env.NODE_ENV === 'development' ? String(queryError?.message) : undefined
        }, { status: 500 });
      }

      // Transform to match expected format
      const items = await Promise.all(
        result.map(async ({ product, seller, category }: {
          product: InferSelectModel<typeof products>;
          seller: InferSelectModel<typeof sellers>;
          category: InferSelectModel<typeof categories> | null;
        }) => {
          // Get primary image
          const images = await db
            .select()
            .from(productImages)
            .where(
              and(
                eq(productImages.productId, product.id),
                eq(productImages.isPrimary, true)
              )
            )
            .limit(1);

          const rawImageUrl = images[0]?.url || product.imageUrl;
          const imageUrl = rawImageUrl && rawImageUrl !== '/placeholder.png' ? rawImageUrl : '/placeholder.svg';
          const imageAlt = images[0]?.alt || product.title;

          return {
            id: product.id,
            title: product.title,
            price: product.priceCents / 100, // Convert cents to RON
            currency: product.currency || 'RON',
            image: {
              src: imageUrl,
              alt: imageAlt,
            },
            seller: seller.brandName || '',
            category: category?.name || '',
            slug: product.slug,
            badge: product.stock < 5 ? 'stoc redus' : undefined,
          };
        })
      );

      console.log('[Search API] Returning:', { itemsCount: items.length, total });
      return NextResponse.json({ items, total });
    }

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