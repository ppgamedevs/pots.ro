import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["draft", "active", "archived"]),
});

async function assertAdmin(): Promise<{ ok: true; userId: string } | { ok: false; res: NextResponse }> {
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

  return { ok: true, userId };
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.res;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
    }

    const { id } = ctx.params;
    const { status } = parsed.data;

    const updated = await db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id, status: products.status });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, product: updated[0] });
  } catch (error) {
    console.error("Admin product status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
