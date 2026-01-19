import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

/**
 * POST /api/migrate/gdpr-preferences
 * Migration endpoint pentru a migra gdpr_preferences de la user_id la email
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[migration] Starting GDPR preferences migration from user_id to email');

    // Verifică dacă există coloana user_id
    const checkUserId = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gdpr_preferences' 
        AND column_name = 'user_id'
      ) as has_user_id
    `);

    const hasUserId = (checkUserId.rows[0] as any)?.has_user_id;

    if (hasUserId) {
      console.log('[migration] Found user_id column, migrating...');

      // Verifică dacă există deja coloana email
      const checkEmail = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'gdpr_preferences' 
          AND column_name = 'email'
        ) as has_email
      `);

      const hasEmail = (checkEmail.rows[0] as any)?.has_email;

      if (!hasEmail) {
        // Adaugă coloana email
        await db.execute(sql`ALTER TABLE gdpr_preferences ADD COLUMN email TEXT`);
        console.log('[migration] Added email column');

        // Migrează datele din user_id în email
        await db.execute(sql`
          UPDATE gdpr_preferences gp
          SET email = u.email
          FROM users u
          WHERE gp.user_id = u.id
        `);
        console.log('[migration] Migrated data from user_id to email');

        // Șterge constraint-urile vechi
        await db.execute(sql`
          ALTER TABLE gdpr_preferences 
          DROP CONSTRAINT IF EXISTS gdpr_preferences_user_id_fkey
        `);
        await db.execute(sql`DROP INDEX IF EXISTS gdpr_preferences_user_idx`);

        // Șterge coloana user_id
        await db.execute(sql`ALTER TABLE gdpr_preferences DROP COLUMN user_id`);
        console.log('[migration] Removed user_id column');

        // Face email NOT NULL și UNIQUE
        await db.execute(sql`ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL`);
        await db.execute(sql`
          ALTER TABLE gdpr_preferences 
          ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email)
        `);
        console.log('[migration] Added NOT NULL and UNIQUE constraints to email');

        // Creează index-ul nou
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx 
          ON gdpr_preferences(email)
        `);
        console.log('[migration] Created index on email');
      }
    } else {
      // Tabelul nu există sau nu are user_id - creează cu schema corectă
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'gdpr_preferences'
        ) as exists
      `);

      const exists = (tableExists.rows[0] as any)?.exists;

      if (!exists) {
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

        console.log('[migration] Created gdpr_preferences table with email column');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    });

  } catch (error: any) {
    console.error('[migration] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error?.message
      },
      { status: 500 }
    );
  }
}
