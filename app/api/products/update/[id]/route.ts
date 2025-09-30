import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";
import { updateProductSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check ownership (this will throw if not owner)
    await assertOwnProduct(params.id, user.id);

    const body = await request.json();
    const updateData = updateProductSchema.parse(body);

    // If status is being changed to 'active', validate required fields
    if (updateData.status === 'active') {
      const currentProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, params.id))
        .limit(1);

      if (currentProduct.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const product = currentProduct[0];
      const finalData = { ...product, ...updateData };

      if (!finalData.title || finalData.priceCents <= 0) {
        return NextResponse.json({ 
          error: "Title and positive price required for active products" 
        }, { status: 400 });
      }
    }

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, params.id))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct[0]);

  } catch (error) {
    console.error("Update product error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.name === 'ZodError') {
        return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
