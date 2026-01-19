/**
 * Script to migrate gdpr_preferences table from user_id to email
 * Run with: npx tsx scripts/run-gdpr-migration.ts
 */

import { sql } from '@vercel/postgres';

async function migrateGdprPreferences() {
  try {
    console.log('[migration] Starting GDPR preferences migration...');

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gdpr_preferences'
      ) as table_exists
    `;

    const tableExists = (tableCheck.rows[0] as any)?.table_exists;
    console.log('[migration] Table exists:', tableExists);

    if (!tableExists) {
      // Create table with correct schema
      console.log('[migration] Creating gdpr_preferences table...');
      await sql`
        CREATE TABLE gdpr_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          consent_type TEXT NOT NULL CHECK (consent_type IN ('necessary', 'all')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX gdpr_preferences_email_idx ON gdpr_preferences(email)
      `;

      console.log('[migration] ✅ Table created successfully with email column');
      return;
    }

    // Check if user_id column exists
    const userIdColumnCheck = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gdpr_preferences' 
        AND column_name = 'user_id'
      ) as has_user_id
    `;

    const hasUserId = (userIdColumnCheck.rows[0] as any)?.has_user_id;
    console.log('[migration] Has user_id column:', hasUserId);

    if (hasUserId) {
      console.log('[migration] Found user_id column, migrating to email...');

      // Check if email column exists
      const emailColumnCheck = await sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'gdpr_preferences' 
          AND column_name = 'email'
        ) as has_email
      `;

      const hasEmail = (emailColumnCheck.rows[0] as any)?.has_email;
      console.log('[migration] Has email column:', hasEmail);

      if (!hasEmail) {
        // Add email column
        console.log('[migration] Adding email column...');
        await sql`ALTER TABLE gdpr_preferences ADD COLUMN email TEXT`;

        // Migrate data from user_id to email
        console.log('[migration] Migrating data from user_id to email...');
        await sql`
          UPDATE gdpr_preferences gp
          SET email = u.email
          FROM users u
          WHERE gp.user_id = u.id
        `;

        // Drop old constraints
        console.log('[migration] Dropping old constraints...');
        await sql`
          ALTER TABLE gdpr_preferences 
          DROP CONSTRAINT IF EXISTS gdpr_preferences_user_id_fkey
        `;
        await sql`DROP INDEX IF EXISTS gdpr_preferences_user_idx`;

        // Drop user_id column
        console.log('[migration] Dropping user_id column...');
        await sql`ALTER TABLE gdpr_preferences DROP COLUMN user_id`;

        // Make email NOT NULL and UNIQUE
        console.log('[migration] Setting email constraints...');
        await sql`ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL`;
        await sql`
          ALTER TABLE gdpr_preferences 
          ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email)
        `;

        // Create new index
        console.log('[migration] Creating index on email...');
        await sql`
          CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx 
          ON gdpr_preferences(email)
        `;

        console.log('[migration] ✅ Migration completed: Migrated from user_id to email');
      } else {
        console.log('[migration] ⚠️ Email column already exists, skipping migration');
      }
    } else {
      // Check if email column exists
      const emailColumnCheck = await sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'gdpr_preferences' 
          AND column_name = 'email'
        ) as has_email
      `;

      const hasEmail = (emailColumnCheck.rows[0] as any)?.has_email;

      if (hasEmail) {
        console.log('[migration] ✅ Table already has correct schema with email column');
      } else {
        console.log('[migration] ⚠️ Table exists but has wrong schema - adding email column...');
        await sql`ALTER TABLE gdpr_preferences ADD COLUMN email TEXT`;
        await sql`ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL`;
        await sql`
          ALTER TABLE gdpr_preferences 
          ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email)
        `;
        await sql`
          CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx 
          ON gdpr_preferences(email)
        `;
        console.log('[migration] ✅ Added email column to existing table');
      }
    }

    console.log('[migration] Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('[migration] ❌ Error:', error);
    console.error('[migration] Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
}

// Run migration
migrateGdprPreferences();
