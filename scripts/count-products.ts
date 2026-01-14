/**
 * Count products in database
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });
require("../lib/env");

async function countProducts() {
  try {
    console.log("🔍 Numărăm produsele din baza de date...\n");

    // Count total products
    const totalResult = await sql`SELECT COUNT(*) as total FROM products`;
    const total = totalResult.rows[0].total;

    // Count by status
    const statusResult = await sql`
      SELECT status, COUNT(*) as count 
      FROM products 
      GROUP BY status 
      ORDER BY status
    `;

    // Count active products with stock
    const activeWithStockResult = await sql`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE status = 'active' AND stock > 0
    `;
    const activeWithStock = activeWithStockResult.rows[0].count;

    console.log("📊 Statistici produse:\n");
    console.log(`   Total produse: ${total}`);
    console.log("\n   După status:");
    statusResult.rows.forEach((row: any) => {
      console.log(`     - ${row.status}: ${row.count}`);
    });
    console.log(`\n   Active cu stoc > 0: ${activeWithStock}`);

    // Get some sample products
    const samples = await sql`
      SELECT title, status, stock, price_cents 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    if (samples.rows.length > 0) {
      console.log("\n   Ultimele 5 produse adăugate:");
      samples.rows.forEach((row: any, index: number) => {
        const price = (row.price_cents / 100).toFixed(2);
        console.log(`     ${index + 1}. ${row.title} (${row.status}, ${row.stock} buc, ${price} RON)`);
      });
    }

  } catch (error: any) {
    console.error("❌ Eroare la numărarea produselor:", error.message);
    process.exit(1);
  }
}

countProducts();
