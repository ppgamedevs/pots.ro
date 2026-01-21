import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sellers, users } from "@/db/schema/core";
import { eq, ilike, or, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin/support
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'support')) {
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
        brandName: sellers.brandName,
        status: sellers.status,
        isPlatform: sellers.isPlatform,
        ordersCount: sql<number>`coalesce(count(${orders.id}), 0)::int`,
        phone: sellers.phone,
        email: sellers.email,
        userEmail: users.email,
      })
      .from(sellers)
      .leftJoin(users, eq(users.id, sellers.userId))
      .leftJoin(orders, eq(orders.sellerId, sellers.id))
      .where(conditions.length > 0 ? or(...conditions)! : undefined)
      .groupBy(sellers.id, users.email)
      .orderBy(sellers.brandName)
      .limit(100);

    return NextResponse.json({ items });

  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
