import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages } from "@/db/schema/core";
import { eq, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    // Check ownership
    await assertOwnProduct(params.id, user.id);

    // Check if product has at least 1 image
    const imageCount = await db
      .select({ count: count() })
      .from(productImages)
      .where(eq(productImages.productId, params.id));

    if (imageCount[0].count === 0) {
      return NextResponse.json({ error: "Product must have at least 1 image to publish" }, { status: 400 });
    }

    // Get product to check required fields
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);

    if (!product[0]) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productData = product[0];
    if (!productData.title || productData.priceCents <= 0) {
      return NextResponse.json({ error: "Product must have title and valid price to publish" }, { status: 400 });
    }

    // Publish product: set status to 'active'
    const updatedProduct = await db
      .update(products)
      .set({ status: 'active' })
      .where(eq(products.id, params.id))
      .returning();

    return NextResponse.json({ success: true, product: updatedProduct[0] });

  } catch (error) {
    console.error("Publish product error:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
