import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productLocks, products } from "@/db/schema/core";
import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { assertOwnProduct } from "@/lib/ownership";
import { z } from "zod";

type ActiveProductLock = {
  id: string;
  scope: 'price' | 'stock' | 'all';
  lockedUntil: Date;
  reason: string;
};

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

    const wantsPriceChange = updateData.price_cents !== undefined;
    const wantsStockChange = updateData.stock !== undefined;
    const wantsAnyChange = Object.keys(updateData).length > 0;

    if (wantsAnyChange) {
      const now = new Date();

      const scopesToCheck: Array<'price' | 'stock' | 'all'> = ['all'];
      if (wantsPriceChange) scopesToCheck.push('price');
      if (wantsStockChange) scopesToCheck.push('stock');

      const activeLocks: ActiveProductLock[] = await db
        .select({
          id: productLocks.id,
          scope: productLocks.scope,
          lockedUntil: productLocks.lockedUntil,
          reason: productLocks.reason,
        })
        .from(productLocks)
        .where(
          and(
            eq(productLocks.productId, params.id),
            isNull(productLocks.revokedAt),
            gt(productLocks.lockedUntil, now),
            inArray(productLocks.scope, scopesToCheck as any)
          )
        )
        .limit(10);

      const blocksAll = activeLocks.some((l: ActiveProductLock) => l.scope === 'all');
      const blocksPrice =
        wantsPriceChange && activeLocks.some((l: ActiveProductLock) => l.scope === 'price' || l.scope === 'all');
      const blocksStock =
        wantsStockChange && activeLocks.some((l: ActiveProductLock) => l.scope === 'stock' || l.scope === 'all');

      if (blocksAll || blocksPrice || blocksStock) {
        const maxUntil = activeLocks.reduce<Date | null>((acc: Date | null, l: ActiveProductLock) => {
          const d = l.lockedUntil;
          if (!acc) return d;
          return d > acc ? d : acc;
        }, null);

        return NextResponse.json(
          {
            error: 'Product is locked by admin',
            code: 'PRODUCT_LOCKED',
            productId: params.id,
            lockedUntil: maxUntil ? maxUntil.toISOString() : null,
            locks: activeLocks.map((l: ActiveProductLock) => ({
              id: String(l.id),
              scope: l.scope,
              lockedUntil: l.lockedUntil ? new Date(l.lockedUntil).toISOString() : null,
              reason: l.reason,
            })),
          },
          { status: 409 }
        );
      }
    }

    // Map API payload (snake_case) to DB columns (camelCase)
    const setData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.title !== undefined) setData.title = updateData.title;
    if (updateData.description !== undefined) setData.description = updateData.description;
    if (updateData.price_cents !== undefined) setData.priceCents = updateData.price_cents;
    if (updateData.stock !== undefined) setData.stock = updateData.stock;
    if (updateData.category_id !== undefined) setData.categoryId = updateData.category_id;
    if (updateData.attributes !== undefined) setData.attributes = updateData.attributes;
    if (updateData.image_url !== undefined) setData.imageUrl = updateData.image_url;

    const updatedProduct = await db
      .update(products)
      .set(setData as any)
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
