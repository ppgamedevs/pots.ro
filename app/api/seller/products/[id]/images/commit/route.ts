import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";
import { validateProductPath } from "@/lib/blob";
import { z } from "zod";

const commitSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0).optional(),
  is_primary: z.boolean().optional(),
});

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

    // Check ownership and get seller info
    const productWithSeller = await assertOwnProduct(params.id, user.id);

    const body = await request.json();
    const { url, alt, position = 0, is_primary = false } = commitSchema.parse(body);

    // Validate URL starts with https and matches expected path
    if (!url.startsWith("https://")) {
      return NextResponse.json({ error: "URL must be HTTPS" }, { status: 400 });
    }

    // Extract pathname from URL for validation
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.substring(1); // Remove leading slash
    
    if (!validateProductPath(pathname, productWithSeller.sellerId, params.id)) {
      return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    // If setting as primary, unset previous primary first
    if (is_primary) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(and(
          eq(productImages.productId, params.id),
          eq(productImages.isPrimary, true)
        ));
    }

    // Create image record
    const newImage = await db
      .insert(productImages)
      .values({
        productId: params.id,
        url,
        alt,
        position,
        isPrimary: is_primary,
      })
      .returning();

    return NextResponse.json({
      id: newImage[0].id,
      url: newImage[0].url,
      is_primary: newImage[0].isPrimary,
    });

  } catch (error) {
    console.error("Commit image error:", error);
    
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
