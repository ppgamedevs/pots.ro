import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userActions, users } from "@/db/schema/core";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/authz";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(req, ['admin']);
    const userId = params.id;

    // Check if user exists
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all actions for this user with admin user info
    console.log('Fetching actions for user:', userId);
    const actions = await db
      .select({
        id: userActions.id,
        action: userActions.action,
        message: userActions.message,
        oldRole: userActions.oldRole,
        newRole: userActions.newRole,
        createdAt: userActions.createdAt,
        adminUser: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(userActions)
      .innerJoin(users, eq(userActions.adminUserId, users.id))
      .where(eq(userActions.userId, userId))
      .orderBy(desc(userActions.createdAt));
    
    console.log('Found actions:', actions.length);

    const response = NextResponse.json({
      actions: actions.map((action: (typeof actions)[number]) => ({
        id: action.id,
        action: action.action,
        message: action.message || "",
        oldRole: action.oldRole || null,
        newRole: action.newRole || null,
        createdAt: action.createdAt.toISOString(),
        adminUser: {
          id: action.adminUser.id,
          email: action.adminUser.email,
          name: action.adminUser.name || "",
        },
      })),
    });

    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error fetching user actions:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch user actions" },
      { status: 500 }
    );
  }
}
