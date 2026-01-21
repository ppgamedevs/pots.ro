import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, users } from "@/db/schema/core";
import { eq, inArray } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["activate", "deactivate", "archive", "delete"]),
  ids: z.array(z.string().uuid()).min(1),
});

async function assertAdmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const userId = await getUserId();
  if (!userId) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.role !== "admin") {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.res;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
    }

    const { action, ids } = parsed.data;

    if (action === "delete") {
      const deleted = await db.delete(products).where(inArray(products.id, ids)).returning({ id: products.id });
      return NextResponse.json({ ok: true, deletedCount: deleted.length });
    }

    const status = action === "activate" ? "active" : action === "deactivate" ? "draft" : "archived";

    const updated = await db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(inArray(products.id, ids))
      .returning({ id: products.id, status: products.status });

    return NextResponse.json({ ok: true, updatedCount: updated.length, status });
  } catch (error) {
    console.error("Admin products bulk action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
