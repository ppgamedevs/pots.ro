import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, sessions } from "@/db/schema/core";
import { eq, and, or, ilike, desc, asc, count, isNull, max } from "drizzle-orm";
import { requireRole } from "@/lib/authz";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const offset = (page - 1) * pageSize;

    // Filters
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where conditions
    const conditions = [];

    // Search filter (email, name)
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          ilike(users.email, searchTerm),
          ilike(users.name, searchTerm)
        )!
      );
    }

    // Role filter
    if (role && role !== "all") {
      conditions.push(eq(users.role, role as "buyer" | "seller" | "admin" | "support"));
    }

    // Status filter
    if (status && status !== "all") {
      conditions.push(eq(users.status, status as "active" | "suspended" | "deleted"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by
    let orderByClause;
    if (sortBy === "email") {
      orderByClause = sortOrder === "asc" ? asc(users.email) : desc(users.email);
    } else if (sortBy === "name") {
      orderByClause = sortOrder === "asc" ? asc(users.name) : desc(users.name);
    } else if (sortBy === "role") {
      orderByClause = sortOrder === "asc" ? asc(users.role) : desc(users.role);
    } else {
      // Default: created_at
      orderByClause = sortOrder === "asc" ? asc(users.createdAt) : desc(users.createdAt);
    }

    // Get total count
    let countWhereClause = whereClause;
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(countWhereClause);

    const totalItems = totalResult?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get users with status directly from column
    const items = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Get last login dates for these users
    const lastLoginMap = new Map<string, Date>();
    if (items.length > 0) {
      const userIdList = items.map((u: any) => u.id);
      
      // Use a simple approach: query last login for each user
      // This is more reliable than array parameters
      const loginPromises = userIdList.map(async (userId: string) => {
        try {
          const [result] = await db
            .select({
              last_login: max(sessions.createdAt),
            })
            .from(sessions)
            .where(and(
              eq(sessions.userId, userId),
              isNull(sessions.revokedAt)
            ));
          
          if (result?.last_login) {
            lastLoginMap.set(userId, new Date(result.last_login));
          }
        } catch (err) {
          console.error(`Error fetching last login for user ${userId}:`, err);
        }
      });
      
      await Promise.all(loginPromises);
    }

    // Transform to match client component expectations
    type ItemType = typeof items[0];
    const transformedItems = items.map((item: ItemType) => ({
      id: item.id,
      email: item.email,
      name: item.name || "",
      role: item.role,
      status: item.status === 'suspended' ? 'suspended' : 'active',
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
      last_login: lastLoginMap.get(item.id)?.toISOString() || null,
    }));

    return NextResponse.json({
      items: transformedItems,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
