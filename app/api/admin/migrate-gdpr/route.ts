import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/migrate-gdpr
 * Execute GDPR preferences migration from user_id to email
 */
export async function GET(request: NextRequest) {
  return await migrateGdpr();
}

/**
 * POST /api/admin/migrate-gdpr
 * Execute GDPR preferences migration from user_id to email
 */
export async function POST(request: NextRequest) {
  return await migrateGdpr();
}

async function migrateGdpr() {
  try {
    console.log('[migrate-gdpr] Starting GDPR preferences migration');

    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gdpr_preferences'
      ) as table_exists
    `);

    const tableExists = (tableCheck.rows[0] as any)?.table_exists;

    if (!tableExists) {
      // Create table with correct schema
      console.log('[migrate-gdpr] Creating gdpr_preferences table');
      await db.execute(sql`
        CREATE TABLE gdpr_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          consent_type TEXT NOT NULL CHECK (consent_type IN ('necessary', 'all')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE INDEX gdpr_preferences_email_idx ON gdpr_preferences(email)
      `);

      return NextResponse.json({
        success: true,
        message: 'Table created successfully with email column'
      });
    }

    // Check if user_id column exists
    const userIdColumnCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gdpr_preferences' 
        AND column_name = 'user_id'
      ) as has_user_id
    `);

    const hasUserId = (userIdColumnCheck.rows[0] as any)?.has_user_id;

    if (hasUserId) {
      console.log('[migrate-gdpr] Found user_id column, migrating to email');

      // Check if email column exists
      const emailColumnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'gdpr_preferences' 
          AND column_name = 'email'
        ) as has_email
      `);

      const hasEmail = (emailColumnCheck.rows[0] as any)?.has_email;

      if (!hasEmail) {
        // Add email column
        await db.execute(sql`ALTER TABLE gdpr_preferences ADD COLUMN email TEXT`);
        console.log('[migrate-gdpr] Added email column');

        // Migrate data from user_id to email
        await db.execute(sql`
          UPDATE gdpr_preferences gp
          SET email = u.email
          FROM users u
          WHERE gp.user_id = u.id
        `);
        console.log('[migrate-gdpr] Migrated data from user_id to email');

        // Drop old constraints
        await db.execute(sql`
          ALTER TABLE gdpr_preferences 
          DROP CONSTRAINT IF EXISTS gdpr_preferences_user_id_fkey
        `);
        await db.execute(sql`DROP INDEX IF EXISTS gdpr_preferences_user_idx`);

        // Drop user_id column
        await db.execute(sql`ALTER TABLE gdpr_preferences DROP COLUMN user_id`);
        console.log('[migrate-gdpr] Removed user_id column');

        // Make email NOT NULL and UNIQUE
        await db.execute(sql`ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL`);
        await db.execute(sql`
          ALTER TABLE gdpr_preferences 
          ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email)
        `);
        console.log('[migrate-gdpr] Added NOT NULL and UNIQUE constraints to email');

        // Create new index
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx 
          ON gdpr_preferences(email)
        `);
        console.log('[migrate-gdpr] Created index on email');

        return NextResponse.json({
          success: true,
          message: 'Migration completed: Migrated from user_id to email'
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Migration already completed: email column exists'
        });
      }
    } else {
      // Check if email column exists
      const emailColumnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'gdpr_preferences' 
          AND column_name = 'email'
        ) as has_email
      `);

      const hasEmail = (emailColumnCheck.rows[0] as any)?.has_email;

      if (hasEmail) {
        return NextResponse.json({
          success: true,
          message: 'Table already has correct schema with email column'
        });
      } else {
        // Table exists but has wrong schema - need to add email
        await db.execute(sql`ALTER TABLE gdpr_preferences ADD COLUMN email TEXT`);
        await db.execute(sql`ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL`);
        await db.execute(sql`
          ALTER TABLE gdpr_preferences 
          ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email)
        `);
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx 
          ON gdpr_preferences(email)
        `);

        return NextResponse.json({
          success: true,
          message: 'Added email column to existing table'
        });
      }
    }

  } catch (error: any) {
    console.error('[migrate-gdpr] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
