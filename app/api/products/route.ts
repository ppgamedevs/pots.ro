import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema/core";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSellerByUser } from "@/lib/ownership";
import { createProductSchema } from "@/lib/validations";
import { slugifyUnique, generateShortId } from "@/lib/slug";

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
    const baseSlug = productData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const shortId = generateShortId();
    const slug = `${baseSlug}-${shortId}`;

    const newProduct = await db
      .insert(products)
      .values({
        sellerId: seller.id,
        slug,
        status: 'draft',
        ...productData,
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });

  } catch (error) {
    console.error("Create product error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
