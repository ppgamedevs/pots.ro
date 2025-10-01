import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages } from "@/db/schema/core";
import { eq, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";
import { buildProductPath, validateMimeType } from "@/lib/blob";
import { z } from "zod";
import { put } from "@vercel/blob";

const signSchema = z.object({
  filename: z.string().min(1).max(100),
  contentType: z.string().optional(),
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
    
    // Check current image count (max 8)
    const imageCount = await db
      .select({ count: count() })
      .from(productImages)
      .where(eq(productImages.productId, params.id));

    if (imageCount[0].count >= 8) {
      return NextResponse.json({ error: "Maximum 8 images per product" }, { status: 400 });
    }

    const body = await request.json();
    const { filename, contentType } = signSchema.parse(body);

    // Validate MIME type
    if (contentType && !validateMimeType(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Build path: product-images/seller-<sellerId>/<productId>/<filename>
    const pathname = buildProductPath(productWithSeller.sellerId, params.id, filename);

    // Generate signed upload URL
    const blob = await put(pathname, new Blob(), {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      pathname,
      publicUrl: blob.url,
    });

  } catch (error) {
    console.error("Sign upload error:", error);
    
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
