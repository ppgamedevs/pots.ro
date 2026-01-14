import { config as dotenvConfig } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.local" });
dotenvConfig();

async function applyMigration() {
  const DATABASE_URL = 
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_POSTGRES_URL ||
    process.env.POSTGRES_URL;

  if (!DATABASE_URL) {
    console.error("❌ No DATABASE_URL found in environment");
    console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('DATABASE')));
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Check if migration has already been applied by checking for orders table and order_status enum
    console.log("🔍 Checking if migration is needed...");
    
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      ) as table_exists
    `;

    const enumCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'order_status'
      ) as enum_exists
    `;

    if (tableCheck[0].table_exists && enumCheck[0].enum_exists) {
      console.log("✅ Migration already applied (orders table and order_status enum exist). Skipping.");
      await sql.end();
      process.exit(0);
    }

    console.log("📄 Reading migration file...");
    const migrationPath = join(process.cwd(), "drizzle", "0008_dark_lyja.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("🚀 Applying migration 0008_dark_lyja...");
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📊 Found ${statements.length} statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql.unsafe(statement);
        if (i % 10 === 0) {
          console.log(`   Executed ${i + 1}/${statements.length} statements...`);
        }
      } catch (err: any) {
        // Continue on errors like "already exists"
        if (err.message?.includes('already exists')) {
          console.log(`   Skipping statement ${i + 1} (already exists)`);
          continue;
        }
        throw err;
      }
    }

    console.log("✅ Migration applied successfully!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message || error);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
