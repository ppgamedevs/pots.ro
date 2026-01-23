import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userActions, sessions } from "@/db/schema/core";
import { eq, desc, max, isNull, and } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['buyer', 'seller', 'admin', 'support']).optional(),
  roleChangeMessage: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  rateLimitBypass: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(req, ['admin']);
    const userId = params.id;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        permissions: users.permissions,
        rateLimitBypass: users.rateLimitBypass,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get last login date (similar to users list API)
    let lastLogin: Date | null = null;
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
        lastLogin = new Date(result.last_login);
      }
    } catch (err) {
      console.error(`Error fetching last login for user ${userId}:`, err);
      // Continue with null last_login
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role,
      status: user.status,
      permissions: (user.permissions as string[]) || [],
      rateLimitBypass: user.rateLimitBypass || false,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      last_login: lastLogin?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole(req, ['admin']);
    const userId = params.id;

    const body = await req.json();
    const data = updateUserSchema.parse(body);

    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user role if we're updating the role
    let oldRole: "buyer" | "seller" | "admin" | "support" | undefined;
    if (data.role !== undefined) {
      const [currentUser] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (currentUser && currentUser.role !== data.role) {
        oldRole = currentUser.role as "buyer" | "seller" | "admin" | "support";
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
        ...(data.rateLimitBypass !== undefined && { rateLimitBypass: data.rateLimitBypass }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        permissions: users.permissions,
        rateLimitBypass: users.rateLimitBypass,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      });

    // If role was changed, record the action
    if (data.role !== undefined && oldRole && data.role !== oldRole) {
      try {
        await db.insert(userActions).values({
          userId: userId,
          action: "role_change",
          message: data.roleChangeMessage || null,
          oldRole: oldRole,
          newRole: data.role as "buyer" | "seller" | "admin" | "support",
          adminUserId: adminUser.id,
        });
      } catch (dbError) {
        // If table doesn't exist or columns don't exist, try to create/alter
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        const errorString = errorMessage.toLowerCase();
        if (dbError instanceof Error && (errorString.includes('user_actions') || errorString.includes('old_role') || errorString.includes('new_role'))) {
          console.log('Updating user_actions table schema');
          try {
            // Try to alter table to add columns if they don't exist
            await db.execute(sql`
              ALTER TABLE user_actions 
              ADD COLUMN IF NOT EXISTS old_role TEXT,
              ADD COLUMN IF NOT EXISTS new_role TEXT
            `);
            
            // Update check constraint to include role_change
            await db.execute(sql`
              ALTER TABLE user_actions 
              DROP CONSTRAINT IF EXISTS user_actions_action_check
            `);
            
            await db.execute(sql`
              ALTER TABLE user_actions 
              ADD CONSTRAINT user_actions_action_check 
              CHECK (action IN ('suspend', 'reactivate', 'role_change'))
            `);
            
            // Try inserting again
            await db.insert(userActions).values({
              userId: userId,
              action: "role_change",
              message: data.roleChangeMessage || null,
              oldRole: oldRole,
              newRole: data.role as "buyer" | "seller" | "admin" | "support",
              adminUserId: adminUser.id,
            });
          } catch (alterError) {
            console.error('Error updating user_actions schema:', alterError);
            // Continue anyway - role change was successful
          }
        } else {
          console.error('Error recording role change action:', dbError);
          // Continue anyway - role change was successful
        }
      }
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || "",
      role: updatedUser.role,
      status: updatedUser.status,
      permissions: (updatedUser.permissions as string[]) || [],
      rateLimitBypass: updatedUser.rateLimitBypass || false,
      created_at: updatedUser.created_at.toISOString(),
      updated_at: updatedUser.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
