import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellers, sellerPages, products, productImages } from "@/db/schema/core";
import { eq, and, desc, count, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const result = await db
      .select({
        seller: sellers,
        page: sellerPages,
      })
      .from(sellers)
      .leftJoin(sellerPages, eq(sellers.id, sellerPages.sellerId))
      .where(eq(sellers.slug, params.slug))
      .limit(1);

    const sellerData = result[0];
    if (!sellerData) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const { seller, page } = sellerData;

    // Get product counts
    const productCounts = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${products.status} = 'active')`,
      })
      .from(products)
      .where(eq(products.sellerId, seller.id));

    const counts = productCounts[0];

    // Get top 6 active products
    const topProducts = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        priceCents: products.priceCents,
        currency: products.currency,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(
        eq(products.sellerId, seller.id),
        eq(products.status, 'active')
      ))
      .orderBy(desc(products.createdAt))
      .limit(6);

    return NextResponse.json({
      id: seller.id,
      slug: seller.slug,
      brandName: seller.brandName,
      about: seller.about,
      page: page ? {
        aboutMd: page.aboutMd,
        seoTitle: page.seoTitle,
        seoDesc: page.seoDesc,
      } : null,
      counts: {
        totalProducts: counts.total,
        activeProducts: counts.active,
      },
      topProducts,
    });

  } catch (error) {
    console.error("Seller API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

