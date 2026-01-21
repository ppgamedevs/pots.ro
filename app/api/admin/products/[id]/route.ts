import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

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

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.res;

    const { id } = ctx.params;

    const deleted = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: deleted[0].id });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
