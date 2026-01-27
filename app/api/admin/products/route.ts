import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, sellers, users } from "@/db/schema/core";
import { eq, and, or, ilike, desc, asc, count, gte, lte } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const companiesParam = searchParams.get("companies");
    const companies: string[] = companiesParam ? JSON.parse(companiesParam) : [];
    const priceRange = searchParams.get("priceRange")?.trim() || "";
    const stockRange = searchParams.get("stockRange")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];
    
    // Status filter
    if (status && status !== "all") {
      conditions.push(eq(products.status, status as "draft" | "active" | "archived"));
    }

    // Price range filter
    if (priceRange && priceRange !== "all") {
      if (priceRange === "0-50") {
        conditions.push(and(gte(products.priceCents, 0), lte(products.priceCents, 5000))!);
      } else if (priceRange === "50-100") {
        conditions.push(and(gte(products.priceCents, 5000), lte(products.priceCents, 10000))!);
      } else if (priceRange === "100-200") {
        conditions.push(and(gte(products.priceCents, 10000), lte(products.priceCents, 20000))!);
      } else if (priceRange === "200-500") {
        conditions.push(and(gte(products.priceCents, 20000), lte(products.priceCents, 50000))!);
      } else if (priceRange === "500+") {
        conditions.push(gte(products.priceCents, 50000));
      }
    }

    // Stock range filter
    if (stockRange && stockRange !== "all") {
      if (stockRange === "0-5") {
        conditions.push(and(gte(products.stock, 0), lte(products.stock, 5))!);
      } else if (stockRange === "6-10") {
        conditions.push(and(gte(products.stock, 6), lte(products.stock, 10))!);
      } else if (stockRange === "11-20") {
        conditions.push(and(gte(products.stock, 11), lte(products.stock, 20))!);
      } else if (stockRange === "30+") {
        conditions.push(gte(products.stock, 30));
      }
    }

    // Company filter - note: we need to join sellers first
    // This will be added after the join

    // Search filter
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          ilike(products.title, searchTerm),
          ilike(products.description, searchTerm)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by
    let orderByClause;
    if (sortBy === "title") {
      orderByClause = sortOrder === "asc" ? asc(products.title) : desc(products.title);
    } else if (sortBy === "price") {
      orderByClause = sortOrder === "asc" ? asc(products.priceCents) : desc(products.priceCents);
    } else if (sortBy === "stock") {
      orderByClause = sortOrder === "asc" ? asc(products.stock) : desc(products.stock);
    } else if (sortBy === "status") {
      orderByClause = sortOrder === "asc" ? asc(products.status) : desc(products.status);
    } else {
      // Default: created_at
      orderByClause = sortOrder === "asc" ? asc(products.createdAt) : desc(products.createdAt);
    }

    // Get total count (with seller join for company filter)
    let countWhereClause = whereClause;
    if (companies.length > 0) {
      const companyConditions = companies.map(company => 
        ilike(sellers.brandName, `%${company}%`)
      );
      const companyCondition = or(...companyConditions)!;
      if (countWhereClause) {
        countWhereClause = and(countWhereClause, companyCondition)!;
      } else {
        countWhereClause = companyCondition;
      }
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(countWhereClause);

    const totalItems = totalResult?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Build join condition and company filter
    let joinWhereClause = whereClause;
    if (companies.length > 0) {
      const companyConditions = companies.map(company => 
        ilike(sellers.brandName, `%${company}%`)
      );
      const companyCondition = or(...companyConditions)!;
      if (joinWhereClause) {
        joinWhereClause = and(joinWhereClause, companyCondition)!;
      } else {
        joinWhereClause = companyCondition;
      }
    }

    // Get products with seller info
    const items = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.priceCents,
        currency: products.currency,
        stock: products.stock,
        status: products.status,
        seller_id: products.sellerId,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
        sellers: {
          slug: sellers.slug,
          brand_name: sellers.brandName,
        },
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(joinWhereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Transform to match client component expectations
    type ItemType = typeof items[0];
    const transformedItems = items.map((item: ItemType) => ({
      id: item.id,
      title: item.title,
      price: item.price / 100, // Convert cents to currency
      currency: item.currency,
      stock: item.stock,
      status: item.status,
      sellers: {
        slug: item.sellers.slug,
        brand_name: item.sellers.brand_name,
      },
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    }));

    return NextResponse.json({
      items: transformedItems,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
