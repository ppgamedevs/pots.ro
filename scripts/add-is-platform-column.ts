/**
 * Add is_platform column to sellers table
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

dotenv.config({ path: ".env.local" });
require("../lib/env");

async function addColumn() {
  try {
    console.log("🔧 Adding is_platform column to sellers table...\n");

    // Check if column already exists
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sellers' AND column_name = 'is_platform'
    `;

    if (checkResult.rows.length > 0) {
      console.log("✅ Column 'is_platform' already exists in sellers table\n");
      return;
    }

    // Add the column
    await sql`
      ALTER TABLE sellers 
      ADD COLUMN is_platform BOOLEAN NOT NULL DEFAULT false
    `;

    console.log("✅ Successfully added 'is_platform' column to sellers table\n");

    // Verify the column was added
    const verifyResult = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sellers' AND column_name = 'is_platform'
    `;

    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log("✅ Verification:");
      console.log(`   Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Default: ${col.column_default}\n`);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

addColumn();
