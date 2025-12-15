import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers } from "@/db/schema/core";
import { eq, and, desc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export interface FeaturedProduct {
  id: string;
  image: {
    src: string;
    alt: string;
  };
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
  stockQty?: number;
}

export async function GET() {
  try {
    // Fetch active products from database
    const result = await db
      .select({
        product: products,
        seller: sellers,
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(eq(products.status, 'active'))
      .orderBy(desc(products.createdAt))
      .limit(8);

    const featuredProducts: FeaturedProduct[] = await Promise.all(
      result.map(async ({ product, seller }: { 
        product: InferSelectModel<typeof products>; 
        seller: InferSelectModel<typeof sellers> 
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

        const imageUrl = images[0]?.url || product.imageUrl || '/placeholder.png';
        const imageAlt = images[0]?.alt || product.title;

        return {
          id: product.id,
          image: {
            src: imageUrl,
            alt: imageAlt,
          },
          title: product.title,
          seller: seller.brandName,
          price: product.priceCents / 100, // Convert cents to RON
          href: `/p/${product.id}-${product.slug}`,
          badge: product.stock < 5 ? 'stoc redus' : undefined,
          stockQty: product.stock || 0,
        };
      })
    );

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
