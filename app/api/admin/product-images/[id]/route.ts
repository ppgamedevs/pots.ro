import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { productImages, products, users } from "@/db/schema/core";
import { and, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["hide", "unhide", "blur", "unblur", "set_primary", "delete"]),
});

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

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdminOrSupport();
    if (!guard.ok) return guard.res;

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
    }

    const { id } = ctx.params;
    const { action } = parsed.data;

    const [img] = await db
      .select({
        id: productImages.id,
        productId: productImages.productId,
        url: productImages.url,
        isHidden: productImages.isHidden,
        isBlurred: productImages.isBlurred,
        isPrimary: productImages.isPrimary,
        moderationStatus: productImages.moderationStatus,
      })
      .from(productImages)
      .where(eq(productImages.id, id))
      .limit(1);

    if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "delete") {
      if (guard.actor.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await db.delete(productImages).where(eq(productImages.id, id));
      await writeAdminAudit({
        actorId: guard.actor.id,
        actorRole: guard.actor.role,
        action: "product_image_delete",
        entityType: "product_image",
        entityId: id,
        meta: { productId: img.productId, url: img.url },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "set_primary") {
      await db
        .update(productImages)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(productImages.productId, img.productId));

      await db
        .update(productImages)
        .set({
          isPrimary: true,
          updatedAt: new Date(),
          moderatedBy: guard.actor.id,
          moderatedAt: new Date(),
        })
        .where(eq(productImages.id, id));

      await db
        .update(products)
        .set({ imageUrl: img.url, updatedAt: new Date() })
        .where(eq(products.id, img.productId));

      await writeAdminAudit({
        actorId: guard.actor.id,
        actorRole: guard.actor.role,
        action: "product_image_set_primary",
        entityType: "product_image",
        entityId: id,
        meta: { productId: img.productId },
      });

      return NextResponse.json({ ok: true });
    }

    const nextHidden = action === "hide" ? true : action === "unhide" ? false : img.isHidden;
    const nextBlurred = action === "blur" ? true : action === "unblur" ? false : img.isBlurred;
    const nextStatus = nextHidden ? "hidden" : nextBlurred ? "blurred" : "approved";

    const [updated] = await db
      .update(productImages)
      .set({
        isHidden: nextHidden,
        isBlurred: nextBlurred,
        moderationStatus: nextStatus as any,
        moderatedBy: guard.actor.id,
        moderatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(productImages.id, id))
      .returning({ id: productImages.id });

    await writeAdminAudit({
      actorId: guard.actor.id,
      actorRole: guard.actor.role,
      action: "product_image_moderate",
      entityType: "product_image",
      entityId: id,
      meta: {
        productId: img.productId,
        from: { isHidden: img.isHidden, isBlurred: img.isBlurred, moderationStatus: img.moderationStatus },
        to: { isHidden: nextHidden, isBlurred: nextBlurred, moderationStatus: nextStatus },
      },
    });

    return NextResponse.json({ ok: true, imageId: updated?.id });
  } catch (error) {
    console.error("Admin product image update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
