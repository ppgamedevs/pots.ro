import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema/core";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSellerByUser } from "@/lib/ownership";
import { slugifyUnique } from "@/lib/slug";
import { z } from "zod";

const createProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price_cents: z.number().int().min(1),
  stock: z.number().int().min(0).default(0),
  category_id: z.string().uuid(),
  attributes: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    const seller = await getSellerByUser(user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const productData = createProductSchema.parse(body);

    // Generate unique slug from title
    const slug = await slugifyUnique(products, productData.title);

    const newProduct = await db
      .insert(products)
      .values({
        sellerId: seller.id,
        slug,
        status: 'draft',
        title: productData.title,
        description: productData.description,
        priceCents: productData.price_cents,
        stock: productData.stock,
        categoryId: productData.category_id,
        attributes: productData.attributes || {},
      })
      .returning();

    return NextResponse.json({
      id: newProduct[0].id,
      slug: newProduct[0].slug,
    }, { status: 201 });

  } catch (error) {
    console.error("Create product error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
