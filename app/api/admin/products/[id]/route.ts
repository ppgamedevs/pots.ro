import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLogs, categories, productImages, productLocks, products, sellers, users } from "@/db/schema/core";
import { and, asc, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

type ActiveProductLock = {
  id: string;
  scope: 'price' | 'stock' | 'all';
  lockedUntil: Date;
  reason: string;
};

async function assertAdminOrSupport(): Promise<
  | { ok: true; actor: { id: string; role: "admin" | "support" } }
  | { ok: false; res: NextResponse }
> {
  const userId = await getUserId();
  if (!userId) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || (user.role !== "admin" && user.role !== "support")) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, actor: { id: userId, role: user.role as "admin" | "support" } };
}

const patchSchema = z
  .object({
    title: z.string().min(2).max(240).optional(),
    description: z.string().max(20000).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    featured: z.boolean().optional(),
    seoTitle: z.string().max(240).nullable().optional(),
    seoDesc: z.string().max(500).nullable().optional(),
    priceCents: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
  })
  .strict();

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdminOrSupport();
    if (!guard.ok) return guard.res;

    const { id } = ctx.params;

    const rows = await db
      .select({
        id: products.id,
        sellerId: products.sellerId,
        categoryId: products.categoryId,
        slug: products.slug,
        title: products.title,
        description: products.description,
        priceCents: products.priceCents,
        currency: products.currency,
        stock: products.stock,
        status: products.status,
        featured: products.featured,
        seoTitle: products.seoTitle,
        seoDesc: products.seoDesc,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        seller: {
          id: sellers.id,
          slug: sellers.slug,
          brandName: sellers.brandName,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    const product = rows[0];
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const images = await db
      .select({
        id: productImages.id,
        url: productImages.url,
        alt: productImages.alt,
        position: productImages.position,
        isPrimary: productImages.isPrimary,
        isHidden: productImages.isHidden,
        isBlurred: productImages.isBlurred,
        moderationStatus: productImages.moderationStatus,
        reportCount: productImages.reportCount,
        moderatedAt: productImages.moderatedAt,
        createdAt: productImages.createdAt,
      })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position), desc(productImages.isPrimary));

    const audit = await db
      .select({
        id: adminAuditLogs.id,
        actorId: adminAuditLogs.actorId,
        actorRole: adminAuditLogs.actorRole,
        action: adminAuditLogs.action,
        message: adminAuditLogs.message,
        meta: adminAuditLogs.meta,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .where(and(eq(adminAuditLogs.entityType, "product"), eq(adminAuditLogs.entityId, id)))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(50);

    return NextResponse.json({ product, images, audit, actorRole: guard.actor.role });
  } catch (error) {
    console.error("Admin product detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdminOrSupport();
    if (!guard.ok) return guard.res;

    const { id } = ctx.params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
    }

    const input = parsed.data;

    if (guard.actor.role !== "admin" && (input.priceCents !== undefined || input.stock !== undefined)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enforce active product locks (admins must revoke lock before modifying locked fields)
    const wantsPriceChange = input.priceCents !== undefined;
    const wantsStockChange = input.stock !== undefined;
    const wantsAnyChange = Object.keys(input).length > 0;
    if (guard.actor.role === 'admin' && wantsAnyChange) {
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
            eq(productLocks.productId, id),
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
        return NextResponse.json(
          {
            error: 'Product is locked',
            code: 'PRODUCT_LOCKED',
            productId: id,
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

    const [before] = await db
      .select({
        title: products.title,
        description: products.description,
        categoryId: products.categoryId,
        featured: products.featured,
        seoTitle: products.seoTitle,
        seoDesc: products.seoDesc,
        priceCents: products.priceCents,
        stock: products.stock,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [updated] = await db
      .update(products)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDesc !== undefined ? { seoDesc: input.seoDesc } : {}),
        ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    const meta: Record<string, { from: unknown; to: unknown }> = {};
    ([
      ["title", before.title, input.title],
      ["description", before.description, input.description],
      ["categoryId", before.categoryId, input.categoryId],
      ["featured", before.featured, input.featured],
      ["seoTitle", before.seoTitle, input.seoTitle],
      ["seoDesc", before.seoDesc, input.seoDesc],
      ["priceCents", before.priceCents, input.priceCents],
      ["stock", before.stock, input.stock],
    ] as const).forEach(([key, from, to]) => {
      if (to !== undefined && to !== from) meta[key] = { from, to };
    });

    await writeAdminAudit({
      actorId: guard.actor.id,
      actorRole: guard.actor.role,
      action: "product_update",
      entityType: "product",
      entityId: id,
      meta,
    });

    return NextResponse.json({ ok: true, productId: updated?.id });
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdminOrSupport();
    if (!guard.ok) return guard.res;

    if (guard.actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = ctx.params;

    const deleted = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await writeAdminAudit({
      actorId: guard.actor.id,
      actorRole: guard.actor.role,
      action: "product_delete",
      entityType: "product",
      entityId: deleted[0].id,
    });

    return NextResponse.json({ ok: true, deletedId: deleted[0].id });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
