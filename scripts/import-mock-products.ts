/**
 * Import all mock products from various mock data files into real database
 * Sources:
 * - app/api/catalog/category/route.ts
 * - lib/data/products.ts
 * - app/api/categories/[slug]/products/route.ts
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

dotenv.config({ path: ".env.local" });
require("../lib/env");

// Mock products from app/api/catalog/category/route.ts
const mockProductsFromCategory: Array<{
  slug: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  seller: { name: string; slug: string };
  category: string;
  attributes: Array<{ label: string; value: string }>;
  stockLabel: string;
}> = [
  {
    slug: 'ghiveci-ceramic-alb-modern',
    title: 'Ghiveci ceramic alb cu model floral modern',
    description: 'Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil.',
    price: 45,
    oldPrice: 60,
    seller: { name: 'FloralDesign', slug: 'floral-design' },
    category: 'ghivece',
    attributes: [
      { label: 'Material', value: 'Ceramică' },
      { label: 'Dimensiuni', value: '20x15 cm' },
      { label: 'Culoare', value: 'Alb' },
      { label: 'Drenaj', value: 'Da' }
    ],
    stockLabel: 'În stoc',
  },
  {
    slug: 'cutie-rotunda-lemn-stejar',
    title: 'Cutie rotundă din lemn de stejar natural',
    description: 'Cutie elegantă din lemn de stejar, perfectă pentru aranjamente florale sau ca element decorativ.',
    price: 89,
    seller: { name: 'WoodCraft', slug: 'wood-craft' },
    category: 'cutii',
    attributes: [
      { label: 'Material', value: 'Lemn de stejar' },
      { label: 'Dimensiuni', value: '25x25x15 cm' },
      { label: 'Finisaj', value: 'Natural' },
      { label: 'Tip', value: 'Rotund' }
    ],
    stockLabel: 'În stoc',
  },
  {
    slug: 'set-unelte-gradinarit-profesional',
    title: 'Set unelte pentru grădinărit profesional',
    description: 'Set complet de unelte pentru grădinărit, incluzând greblă, sapă și cultivator.',
    price: 125,
    oldPrice: 150,
    seller: { name: 'GardenPro', slug: 'garden-pro' },
    category: 'accesorii',
    attributes: [
      { label: 'Material', value: 'Oțel inoxidabil' },
      { label: 'Set', value: '3 unelte' },
      { label: 'Maner', value: 'Lemn tratat' },
      { label: 'Garantie', value: '2 ani' }
    ],
    stockLabel: 'Stoc redus',
  }
];

// Mock products from lib/data/products.ts
const mockProductsFromLib: Array<{
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  stock_qty: number;
  sellerSlug: string;
  category?: string;
  attributes?: Record<string, unknown>;
}> = [
  {
    slug: 'ghiveci-ceramic-alb',
    title: 'Ghiveci ceramic alb',
    description: 'Ghiveci ceramic cu finisaj mat, potrivit pentru plante de interior.',
    price_cents: 4990,
    stock_qty: 15,
    sellerSlug: 'atelier-ceramic',
    category: 'ghivece',
    attributes: {
      drainage_hole: true,
      saucer_included: false,
      indoor_outdoor: 'indoor',
      uv_resistant: false,
      frost_resistant: false
    }
  },
  {
    slug: 'vaza-sticla-inalta',
    title: 'Vază sticlă înaltă',
    description: 'Vază din sticlă transparentă, perfectă pentru aranjamente florale moderne.',
    price_cents: 8990,
    stock_qty: 8,
    sellerSlug: 'glass-art',
    category: 'vaze',
    attributes: {
      indoor_outdoor: 'indoor',
      food_safe: true,
      dishwasher_safe: true
    }
  },
  {
    slug: 'cutie-florala-natur',
    title: 'Cutie florală natur',
    description: 'Cutie din carton reciclat, perfectă pentru aranjamente florale rustice.',
    price_cents: 2590,
    stock_qty: 3,
    sellerSlug: 'cardboard-street',
    category: 'cutii',
    attributes: {
      tall_or_normal: 'normal',
      painted: false,
      personalizable: true,
      eco_cert: 'FSC',
      recyclable: true
    }
  }
];

async function importMockProducts() {
  try {
    console.log("🌱 Importing all mock products to real database...\n");

    // Helper function to get or create seller
    async function getOrCreateSeller(sellerName: string, sellerSlug: string) {
      let sellerResult = await sql`
        SELECT id FROM sellers WHERE slug = ${sellerSlug} LIMIT 1
      `;
      
      if (sellerResult.rows.length > 0) {
        return sellerResult.rows[0].id;
      }

      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, role, display_id)
        VALUES (${`${sellerSlug}@example.com`}, 'seller', ${sellerSlug})
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Create seller
      const newSellerResult = await sql`
        INSERT INTO sellers (user_id, slug, brand_name, status)
        VALUES (${userId}, ${sellerSlug}, ${sellerName}, 'active')
        RETURNING id
      `;
      
      console.log(`   ✅ Created seller: ${sellerName} (${sellerSlug})`);
      return newSellerResult.rows[0].id;
    }

    // Helper function to get or create category
    async function getOrCreateCategory(categorySlug: string, categoryName: string) {
      let categoryResult = await sql`
        SELECT id FROM categories WHERE slug = ${categorySlug} LIMIT 1
      `;
      
      if (categoryResult.rows.length > 0) {
        return categoryResult.rows[0].id;
      }

      const newCategoryResult = await sql`
        INSERT INTO categories (name, slug, position)
        VALUES (${categoryName}, ${categorySlug}, 0)
        RETURNING id
      `;
      
      console.log(`   ✅ Created category: ${categoryName} (${categorySlug})`);
      return newCategoryResult.rows[0].id;
    }

    // Convert attributes array to object
    function attributesArrayToObject(attributes: Array<{ label: string; value: string }>) {
      const obj: Record<string, string> = {};
      attributes.forEach(attr => {
        obj[attr.label.toLowerCase().replace(/\s+/g, '_')] = attr.value;
      });
      return obj;
    }

    // Determine stock from stockLabel
    function getStockFromLabel(stockLabel: string): number {
      if (stockLabel === 'În stoc') return 30;
      if (stockLabel === 'Stoc redus') return 5;
      return 0;
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    // Import products from app/api/catalog/category/route.ts
    console.log("📦 Importing products from app/api/catalog/category/route.ts...\n");
    for (const mockProduct of mockProductsFromCategory) {
      // Check if product already exists
      const existing = await sql`
        SELECT id, slug, title FROM products WHERE slug = ${mockProduct.slug}
      `;

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping "${mockProduct.title}" - already exists`);
        totalSkipped++;
        continue;
      }

      // Get or create seller
      const sellerId = await getOrCreateSeller(mockProduct.seller.name, mockProduct.seller.slug);

      // Get or create category
      const categoryName = mockProduct.category.charAt(0).toUpperCase() + mockProduct.category.slice(1);
      const categoryId = await getOrCreateCategory(mockProduct.category, categoryName);

      // Convert price to cents
      const priceCents = Math.round(mockProduct.price * 100);

      // Get stock from stockLabel
      const stock = getStockFromLabel(mockProduct.stockLabel);

      // Convert attributes
      const attributes = attributesArrayToObject(mockProduct.attributes);

      // Insert product
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
          ${mockProduct.slug},
          ${mockProduct.title},
          ${mockProduct.description},
          ${priceCents},
          'RON',
          ${stock},
          'active',
          '/placeholder.png',
          ${JSON.stringify(attributes)}
        )
        RETURNING id, slug, title, price_cents, stock
      `;

      const product = productResult.rows[0];
      const price = (product.price_cents / 100).toFixed(2);
      
      console.log(`✅ Added: ${product.title} (${price} RON, ${product.stock} buc)`);
      totalAdded++;
    }

    // Import products from lib/data/products.ts
    console.log("\n📦 Importing products from lib/data/products.ts...\n");
    for (const mockProduct of mockProductsFromLib) {
      // Check if product already exists
      const existing = await sql`
        SELECT id, slug, title FROM products WHERE slug = ${mockProduct.slug}
      `;

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping "${mockProduct.title}" - already exists`);
        totalSkipped++;
        continue;
      }

      // Get or create seller (need to infer name from slug)
      const sellerName = mockProduct.sellerSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const sellerId = await getOrCreateSeller(sellerName, mockProduct.sellerSlug);

      // Get or create category
      let categoryId = null;
      if (mockProduct.category) {
        const categoryName = mockProduct.category.charAt(0).toUpperCase() + mockProduct.category.slice(1);
        categoryId = await getOrCreateCategory(mockProduct.category, categoryName);
      }

      // Insert product
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
          ${mockProduct.slug},
          ${mockProduct.title},
          ${mockProduct.description},
          ${mockProduct.price_cents},
          'RON',
          ${mockProduct.stock_qty},
          'active',
          '/placeholder.png',
          ${JSON.stringify(mockProduct.attributes || {})}
        )
        RETURNING id, slug, title, price_cents, stock
      `;

      const product = productResult.rows[0];
      const price = (product.price_cents / 100).toFixed(2);
      
      console.log(`✅ Added: ${product.title} (${price} RON, ${product.stock} buc)`);
      totalAdded++;
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`   ✅ Added: ${totalAdded} products`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} products (already exist)\n`);

    // List all imported products
    console.log("📋 Summary of imported products:\n");
    const allImported = await sql`
      SELECT slug, title, price_cents, stock 
      FROM products 
      WHERE slug IN (
        'ghiveci-ceramic-alb-modern',
        'cutie-rotunda-lemn-stejar',
        'set-unelte-gradinarit-profesional',
        'ghiveci-ceramic-alb',
        'vaza-sticla-inalta',
        'cutie-florala-natur'
      )
      ORDER BY title
    `;

    allImported.rows.forEach((row: any) => {
      const price = (row.price_cents / 100).toFixed(2);
      console.log(`   • ${row.title}`);
      console.log(`     Slug: ${row.slug}`);
      console.log(`     Price: ${price} RON | Stock: ${row.stock} buc`);
      console.log(`     URL: http://localhost:3000/p/${row.slug}\n`);
    });

  } catch (error: any) {
    if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
      console.log("⚠️  Some products already exist in database");
    } else {
      console.error("❌ Error:", error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

importMockProducts();
