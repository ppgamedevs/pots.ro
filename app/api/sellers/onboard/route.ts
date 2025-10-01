import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellers } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { slugifyUnique } from "@/lib/slug";
import { z } from "zod";

const onboardSchema = z.object({
  brand_name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user already has a seller profile
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, user.id))
      .limit(1);

    if (existingSeller.length > 0) {
      return NextResponse.json({ error: "User already has a seller profile" }, { status: 409 });
    }

    const body = await request.json();
    const { brand_name, slug } = onboardSchema.parse(body);

    // Generate unique slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await slugifyUnique(sellers, brand_name);
    } else {
      // Check if provided slug is unique
      const existingSlug = await db
        .select()
        .from(sellers)
        .where(eq(sellers.slug, finalSlug))
        .limit(1);
      
      if (existingSlug.length > 0) {
        finalSlug = await slugifyUnique(sellers, brand_name);
      }
    }

    // Create seller profile
    const newSeller = await db
      .insert(sellers)
      .values({
        userId: user.id,
        brandName: brand_name,
        slug: finalSlug,
      })
      .returning();

    return NextResponse.json({
      seller: {
        id: newSeller[0].id,
        slug: newSeller[0].slug,
        brand_name: newSeller[0].brandName,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Seller onboarding error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
