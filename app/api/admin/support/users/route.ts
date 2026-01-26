import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { generateUniqueDisplayId } from "@/lib/utils/displayId";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["admin"]);

    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    const defaultEmail = (process.env.SUPPORT_EMAIL ?? "support@pots.ro").trim().toLowerCase() || "support@pots.ro";
    const email = parsed.success && parsed.data.email
      ? parsed.data.email.trim().toLowerCase()
      : defaultEmail;

    const [existing] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      await db
        .update(users)
        .set({ role: "support", updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      return NextResponse.json({
        ok: true,
        user: { id: existing.id, email: existing.email, role: "support" as const },
        created: false,
      });
    }

    const displayId = await generateUniqueDisplayId(db, users, email);
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: null,
        displayId,
        role: "support",
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    if (!created) {
      return NextResponse.json(
        { error: "Failed to create support user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: { id: created.id, email: created.email, role: "support" as const },
      created: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[POST /api/admin/support/users]", error);
    return NextResponse.json(
      { error: "Failed to provision support user" },
      { status: 500 }
    );
  }
}
