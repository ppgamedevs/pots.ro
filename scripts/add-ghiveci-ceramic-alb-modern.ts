/**
 * Add the specific product ghiveci-ceramic-alb-modern to database
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

dotenv.config({ path: ".env.local" });
require("../lib/env");

async function addProduct() {
  try {
    console.log("🌱 Adding product: ghiveci-ceramic-alb-modern\n");

    // Get or create seller
    let sellerResult = await sql`
      SELECT id, brand_name FROM sellers LIMIT 1
    `;
    
    let sellerId;
    if (sellerResult.rows.length > 0) {
      sellerId = sellerResult.rows[0].id;
      console.log(`✅ Using seller: ${sellerResult.rows[0].brand_name}`);
    } else {
      const userResult = await sql`
        INSERT INTO users (email, role, display_id)
        VALUES (${`seller-${Date.now()}@example.com`}, 'seller', ${`seller${Date.now()}`})
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      const newSellerResult = await sql`
        INSERT INTO sellers (user_id, slug, brand_name, status)
        VALUES (${userId}, ${`seller-${Date.now()}`}, 'FloralDesign', 'active')
        RETURNING id
      `;
      sellerId = newSellerResult.rows[0].id;
      console.log(`✅ Created seller: FloralDesign`);
    }

    // Get category
    let categoryResult = await sql`
      SELECT id FROM categories WHERE slug = 'ghivece' LIMIT 1
    `;
    
    let categoryId = categoryResult.rows[0]?.id || null;
    if (!categoryId) {
      const newCatResult = await sql`
        INSERT INTO categories (name, slug, position)
        VALUES ('Ghivece', 'ghivece', 0)
        RETURNING id
      `;
      categoryId = newCatResult.rows[0].id;
      console.log(`✅ Created category: Ghivece`);
    }

    // Check if product already exists
    const existing = await sql`
      SELECT id, slug, title FROM products WHERE slug = 'ghiveci-ceramic-alb-modern'
    `;

    if (existing.rows.length > 0) {
      console.log(`⚠️  Product already exists:`);
      console.log(`   ID: ${existing.rows[0].id}`);
      console.log(`   Title: ${existing.rows[0].title}`);
      console.log(`   URL: http://localhost:3000/p/${existing.rows[0].slug}\n`);
      return;
    }

    // Insert product with exact slug
    const productResult = await sql`
      INSERT INTO products (
        seller_id, 
        category_id, 
        slug, 
        title, 
        description,
        price_cents, 
        currency,
        stock, 
        status, 
        image_url, 
        attributes
      )
      VALUES (
        ${sellerId}, 
        ${categoryId},
        'ghiveci-ceramic-alb-modern',
        'Ghiveci ceramic alb cu model floral modern',
        'Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil care se potrivește cu orice stil de decor. Produsul este realizat manual de artizani experimentați, garantând calitatea și durabilitatea. Include găuri de drenaj pentru sănătatea plantelor și poate fi folosit atât în interior, cât și în exterior.',
        4500,
        'RON',
        25,
        'active',
        '/placeholder.png',
        ${JSON.stringify({
          material: 'Ceramică de calitate superioară',
          dimensions: '20x15x12 cm',
          color: 'Alb cu model floral',
          drainage: 'Da, 2 găuri',
          weight: '850g',
          origin: 'România',
          warranty: '2 ani',
          care: 'Spălare cu apă caldă'
        })}
      )
      RETURNING id, slug, title, price_cents, stock
    `;

    const product = productResult.rows[0];
    const price = (product.price_cents / 100).toFixed(2);
    
    console.log(`✅ Product created successfully!`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   Slug: ${product.slug}`);
    console.log(`   Price: ${price} RON`);
    console.log(`   Stock: ${product.stock} buc`);
    console.log(`   URL: http://localhost:3000/p/${product.slug}\n`);

  } catch (error: any) {
    if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
      console.log("⚠️  Product with this slug already exists in database");
      const existing = await sql`
        SELECT id, slug, title FROM products WHERE slug = 'ghiveci-ceramic-alb-modern'
      `;
      if (existing.rows.length > 0) {
        console.log(`   ID: ${existing.rows[0].id}`);
        console.log(`   Title: ${existing.rows[0].title}`);
        console.log(`   URL: http://localhost:3000/p/${existing.rows[0].slug}\n`);
      }
    } else {
      console.error("❌ Error:", error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

addProduct();
