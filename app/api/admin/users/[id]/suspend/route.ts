import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userActions } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const suspendUserSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  message: z.string().min(10, "Mesajul trebuie să aibă minimum 10 caractere"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole(req, ['admin']);
    const userId = params.id;

    const body = await req.json();
    const data = suspendUserSchema.parse(body);

    // Check if user exists
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Insert action record
    try {
      await db.insert(userActions).values({
        userId: userId,
        action: data.action,
        message: data.message || null,
        adminUserId: adminUser.id,
      });
    } catch (dbError) {
      // If table doesn't exist, create it
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      const errorString = errorMessage.toLowerCase();
      if (dbError instanceof Error && errorString.includes('user_actions')) {
        console.log('Creating user_actions table');
        await db.execute(`
          CREATE TABLE IF NOT EXISTS user_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action TEXT NOT NULL CHECK (action IN ('suspend', 'reactivate')),
            message TEXT,
            admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          )
        `);
        
        await db.execute(`
          CREATE INDEX IF NOT EXISTS user_actions_user_id_idx ON user_actions(user_id)
        `);
        
        await db.execute(`
          CREATE INDEX IF NOT EXISTS user_actions_created_idx ON user_actions(created_at)
        `);
        
        // Try inserting again
        await db.insert(userActions).values({
          userId: userId,
          action: data.action,
          message: data.message || null,
          adminUserId: adminUser.id,
        });
        console.log('User action stored successfully after creating table');
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${data.action === 'suspend' ? 'suspended' : 'reactivated'} successfully`
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    
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
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Full error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      console.error("Unknown error type:", error);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update user status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
