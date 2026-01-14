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
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Check if migration has already been applied
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      ) as table_exists
    `;

    if (result[0].table_exists) {
      console.log("✅ Orders table already exists. Migration may have been applied.");
      console.log("🔍 Checking for order_status enum...");
      
      const enumCheck = await sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'order_status'
        ) as enum_exists
      `;
      
      if (enumCheck[0].enum_exists) {
        console.log("✅ Migration already applied. Skipping.");
        process.exit(0);
      }
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

    for (const statement of statements) {
      await sql.unsafe(statement);
    }

    // Update drizzle migrations table
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0008_dark_lyja', ${Date.now()})
      ON CONFLICT (hash) DO NOTHING
    `;

    console.log("✅ Migration applied successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
