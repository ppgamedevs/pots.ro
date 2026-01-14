/**
 * Add sample products to database for testing add to cart functionality
 * Uses SQL directly to bypass db abstraction issues
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables FIRST
dotenv.config({ path: ".env.local" });
require("../lib/env");

async function addSampleProducts() {
  try {
    console.log("🌱 Adding sample products...\n");

    // Get or create a test seller
    let sellerResult = await sql`
      SELECT id, brand_name, slug FROM sellers LIMIT 1
    `;
    
    let sellerId;
    if (sellerResult.rows.length > 0) {
      sellerId = sellerResult.rows[0].id;
      console.log(`✅ Using existing seller: ${sellerResult.rows[0].brand_name}`);
    } else {
      // Create a test user first
      const userResult = await sql`
        INSERT INTO users (email, role, display_id)
        VALUES (${`test-seller-${Date.now()}@example.com`}, 'seller', ${`seller${Date.now()}`})
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Create a test seller
      const newSellerResult = await sql`
        INSERT INTO sellers (user_id, slug, brand_name, about, status)
        VALUES (${userId}, ${`test-seller-${Date.now()}`}, 'Test Seller', 'Test seller pentru produse demo', 'active')
        RETURNING id, brand_name
      `;
      sellerId = newSellerResult.rows[0].id;
      console.log(`✅ Created test seller: ${newSellerResult.rows[0].brand_name}`);
    }

    // Get or create category
    let categoryResult = await sql`
      SELECT id, name FROM categories WHERE slug = 'ghivece' LIMIT 1
    `;
    
    let categoryId;
    if (categoryResult.rows.length > 0) {
      categoryId = categoryResult.rows[0].id;
      console.log(`✅ Using category: ${categoryResult.rows[0].name}\n`);
    } else {
      const newCategoryResult = await sql`
        INSERT INTO categories (name, slug, position)
        VALUES ('Ghivece', 'ghivece', 0)
        RETURNING id, name
      `;
      categoryId = newCategoryResult.rows[0].id;
      console.log(`✅ Created category: ${newCategoryResult.rows[0].name}\n`);
    }

    // Sample products data
    const sampleProducts = [
      {
        title: "Ghiveci Ceramic Modern - Alb",
        description: "Ghiveci ceramic elegant, perfect pentru plante de interior. Design modern cu linii curate. Dimensiuni: 15x15x12 cm. Include farfurioară de drenaj.",
        priceCents: 8999,
        stock: 25,
        status: 'active',
        imageUrl: "/placeholder.png",
        attributes: { material: "Ceramică", color: "Alb", size: "Mediu", dimensions: "15x15x12 cm" }
      },
      {
        title: "Cutie Florală Rotundă - Natural",
        description: "Cutie florală rotundă din material natural, ideală pentru buchete și aranjamente. Perforată pentru drenaj. Dimensiuni: 20 cm diametru.",
        priceCents: 4500,
        stock: 50,
        status: 'active',
        imageUrl: "/placeholder.png",
        attributes: { material: "Material natural", color: "Natural", size: "Mare", shape: "Rotund", diameter: "20 cm" }
      },
      {
        title: "Vază Modernă Sticlă - Transparentă",
        description: "Vază modernă din sticlă groasă, perfectă pentru flori de câmp și aranjamente elegante. Design minimalist. Înălțime: 25 cm.",
        priceCents: 12999,
        stock: 15,
        status: 'active',
        imageUrl: "/placeholder.png",
        attributes: { material: "Sticlă", color: "Transparent", height: "25 cm", style: "Modern" }
      }
    ];

    console.log("📦 Creating products...\n");
    
    for (const productData of sampleProducts) {
      // Generate slug from title
      const slug = productData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${Date.now()}`;

      const productResult = await sql`
        INSERT INTO products (
          seller_id, category_id, slug, title, description,
          price_cents, stock, status, image_url, attributes
        )
        VALUES (
          ${sellerId}, ${categoryId}, ${slug}, ${productData.title}, ${productData.description},
          ${productData.priceCents}, ${productData.stock}, ${productData.status}, ${productData.imageUrl}, ${JSON.stringify(productData.attributes)}
        )
        RETURNING slug, title, price_cents, stock
      `;

      const product = productResult.rows[0];
      const price = (product.price_cents / 100).toFixed(2);
      console.log(`✅ Created: ${product.title}`);
      console.log(`   Preț: ${price} RON | Stoc: ${product.stock} buc | Slug: ${product.slug}\n`);
    }

    console.log("🎉 Sample products added successfully!");
    console.log("\n💡 You can now test the add to cart functionality with these products.");
    
    // Show product URLs
    const allProducts = await sql`
      SELECT slug FROM products 
      WHERE seller_id = ${sellerId}
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    if (allProducts.rows.length > 0) {
      console.log("\n📋 Product URLs:");
      allProducts.rows.forEach((p: any, index: number) => {
        console.log(`   ${index + 1}. http://localhost:3000/p/${p.slug}`);
      });
    }

  } catch (error: any) {
    console.error("❌ Error adding sample products:", error.message);
    console.error(error);
    process.exit(1);
  }
}

addSampleProducts();
