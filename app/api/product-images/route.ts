import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productImages, products, sellers } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createProductImageSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, url, alt, position } = createProductImageSchema.parse(body);

    // Validate that the user owns the product
    const productWithSeller = await db
      .select({
        product: products,
        seller: sellers,
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (productWithSeller.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { seller } = productWithSeller[0];
    if (seller.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate URL format and seller path
    if (!url.startsWith("https://")) {
      return NextResponse.json({ 
        error: "Invalid URL format" 
      }, { status: 400 });
    }

    // Optional: Validate Vercel Blob URL and seller folder path
    const expectedPrefix = `seller-${seller.id}/`;
    if (url.includes('blob.vercel-storage.com') && !url.includes(expectedPrefix)) {
      return NextResponse.json({ 
        error: "Invalid file path" 
      }, { status: 400 });
    }

    const newImage = await db
      .insert(productImages)
      .values({
        productId,
        url,
        alt,
        position,
      })
      .returning();

    return NextResponse.json(newImage[0], { status: 201 });

  } catch (error) {
    console.error("Create product image error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

