import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";
import { z } from "zod";

const updateProductSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  price_cents: z.number().int().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  category_id: z.string().uuid().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  image_url: z.string().url().optional(),
});

export async function PATCH(
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

    const body = await request.json();
    const updateData = updateProductSchema.parse(body);

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, params.id))
      .returning();

    return NextResponse.json(updatedProduct[0]);

  } catch (error) {
    console.error("Update product error:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Soft delete: set status to 'archived'
    const updatedProduct = await db
      .update(products)
      .set({ status: 'archived' })
      .where(eq(products.id, params.id))
      .returning();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete product error:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
