import { NextResponse } from "next/server";
import { db } from "@/db";
import { sellers, users } from "@/db/schema/core";
import { eq, ilike, or } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    // Build where conditions
    const conditions = [];
    
    // Search filter
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          ilike(sellers.brandName, searchTerm),
          ilike(sellers.slug, searchTerm)
        )!
      );
    }

    // Get sellers
    const items = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        brand_name: sellers.brandName,
      })
      .from(sellers)
      .where(conditions.length > 0 ? or(...conditions)! : undefined)
      .orderBy(sellers.brandName)
      .limit(100);

    return NextResponse.json({ items });

  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
