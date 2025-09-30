import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers, categories } from "@/db/schema/core";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { canReadProduct } from "@/lib/access";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    
    const result = await db
      .select({
        product: products,
        seller: sellers,
        category: categories,
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, params.slug))
      .limit(1);

    const productData = result[0];
    if (!productData) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { product, seller, category } = productData;

    // Check access permissions
    if (!canReadProduct(user, product, seller.userId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get product images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.position);

    return NextResponse.json({
      ...product,
      images,
      seller: {
        id: seller.id,
        slug: seller.slug,
        brandName: seller.brandName,
      },
      category: category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
      } : null,
    });

  } catch (error) {
    console.error("Product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

