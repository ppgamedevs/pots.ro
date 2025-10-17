import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function POST(request: NextRequest) {
  try {
    console.log('[migration] Starting display_id migration');
    
    // Step 1: Add the column as nullable first
    await db.execute(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "display_id" text
    `);
    console.log('[migration] Added display_id column');
    
    // Step 2: Update existing users with a default display_id
    await db.execute(`
      UPDATE "users" 
      SET "display_id" = 'user' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || id::text
      WHERE "display_id" IS NULL
    `);
    console.log('[migration] Updated existing users with display_id');
    
    // Step 3: Make the column NOT NULL
    await db.execute(`
      ALTER TABLE "users" 
      ALTER COLUMN "display_id" SET NOT NULL
    `);
    console.log('[migration] Made display_id NOT NULL');
    
    // Step 4: Create unique constraint
    await db.execute(`
      ALTER TABLE "users" 
      ADD CONSTRAINT IF NOT EXISTS "users_display_id_unique" UNIQUE("display_id")
    `);
    console.log('[migration] Added unique constraint');
    
    // Step 5: Create index
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "users_display_id_idx" ON "users" USING btree ("display_id")
    `);
    console.log('[migration] Created index');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully' 
    });
    
  } catch (error) {
    console.error('[migration] Error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
