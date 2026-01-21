/**
 * Add internal_notes column to seller_applications table
 */
import dotenv from 'dotenv';
import { sql } from '@vercel/postgres';

dotenv.config({ path: '.env.local' });
require('../lib/env');

async function addColumn() {
  try {
    console.log('🔧 Adding internal_notes column to seller_applications table...\n');

    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'seller_applications' AND column_name = 'internal_notes'
    `;

    if (checkResult.rows.length > 0) {
      console.log("✅ Column 'internal_notes' already exists in seller_applications table\n");
      return;
    }

    await sql`
      ALTER TABLE seller_applications
      ADD COLUMN internal_notes TEXT
    `;

    console.log("✅ Successfully added 'internal_notes' column to seller_applications table\n");
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addColumn();
