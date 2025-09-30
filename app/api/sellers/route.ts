import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellers } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSellerSchema } from "@/lib/validations";
import { slugifyUnique } from "@/lib/slug";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    // Check if user already has a seller profile
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, user.id))
      .limit(1);

    if (existingSeller.length > 0) {
      return NextResponse.json({ error: "Seller profile already exists" }, { status: 409 });
    }

    const body = await request.json();
    const { slug, brandName, about } = createSellerSchema.parse(body);

    // Ensure slug is unique
    const uniqueSlug = await slugifyUnique(sellers, slug);

    const newSeller = await db
      .insert(sellers)
      .values({
        userId: user.id,
        slug: uniqueSlug,
        brandName,
        about,
      })
      .returning();

    return NextResponse.json(newSeller[0], { status: 201 });

  } catch (error) {
    console.error("Create seller error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

