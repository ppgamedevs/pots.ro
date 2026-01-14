/**
 * List all products in database
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });
require("../lib/env");

async function listProducts() {
  try {
    console.log("🔍 Listăm produsele din baza de date...\n");

    // Get all products with their details
    const products = await sql`
      SELECT 
        id,
        slug,
        title,
        status,
        stock,
        price_cents,
        created_at
      FROM products 
      ORDER BY created_at DESC
    `;

    if (products.rows.length === 0) {
      console.log("❌ Nu există produse în baza de date.");
      return;
    }

    console.log(`📦 Total produse: ${products.rows.length}\n`);
    console.log("=" .repeat(100));
    
    products.rows.forEach((row: any, index: number) => {
      const price = row.price_cents ? (row.price_cents / 100).toFixed(2) : "N/A";
      const date = row.created_at ? new Date(row.created_at).toLocaleDateString('ro-RO') : "N/A";
      
      console.log(`\n${index + 1}. ${row.title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Slug: ${row.slug}`);
      console.log(`   URL: http://localhost:3000/p/${row.slug}`);
      console.log(`   Status: ${row.status || 'N/A'}`);
      console.log(`   Stoc: ${row.stock || 0} buc`);
      console.log(`   Preț: ${price} RON`);
      console.log(`   Adăugat: ${date}`);
    });

    console.log("\n" + "=".repeat(100));
    console.log(`\n✅ Găsite ${products.rows.length} produse în total.`);

  } catch (error: any) {
    console.error("❌ Eroare la listarea produselor:", error.message);
    process.exit(1);
  }
}

listProducts();
