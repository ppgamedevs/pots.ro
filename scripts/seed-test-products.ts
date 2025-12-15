import { config } from "dotenv";
import { db } from "../db/index";
import { products, categories, sellers, users, productImages } from "../db/schema/core";
import { eq } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });
config();

// Import env normalization after loading .env
import "../lib/env";

async function seedTestProducts() {
  console.log("🌱 Starting test products seed...");
  
  try {
    // 1. Get or create a test category (ghivece)
    let category = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "ghivece"))
      .limit(1);

    if (category.length === 0) {
      // Create category if it doesn't exist
      const newCategory = await db
        .insert(categories)
        .values({
          name: "Ghivece",
          slug: "ghivece",
          position: 0,
        })
        .returning();
      category = newCategory;
      console.log("✅ Created category: Ghivece");
    } else {
      console.log("✅ Category exists: Ghivece");
    }

    const categoryId = category[0].id;

    // 2. Get or create a test user (seller)
    let testUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "test-seller@pots.ro"))
      .limit(1);

    if (testUser.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          email: "test-seller@pots.ro",
          name: "Test Seller",
          role: "seller",
        })
        .returning();
      testUser = newUser;
      console.log("✅ Created test user: test-seller@pots.ro");
    } else {
      console.log("✅ Test user exists: test-seller@pots.ro");
    }

    const userId = testUser[0].id;

    // 3. Get or create a test seller
    let seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId))
      .limit(1);

    if (seller.length === 0) {
      const newSeller = await db
        .insert(sellers)
        .values({
          userId: userId,
          slug: "test-seller",
          brandName: "Test Seller",
          about: "Vânzător de test pentru produse de floristică",
          status: "active",
        })
        .returning();
      seller = newSeller;
      console.log("✅ Created test seller: test-seller");
    } else {
      console.log("✅ Test seller exists: test-seller");
    }

    const sellerId = seller[0].id;

    // 4. Create 2 test products
    const testProducts = [
      {
        title: "Ghiveci ceramic alb cu model floral modern",
        description: "Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil care se potrivește cu orice stil de decor. Produsul este realizat manual de artizani experimentați, garantând calitatea și durabilitatea. Include găuri de drenaj pentru sănătatea plantelor și poate fi folosit atât în interior, cât și în exterior.",
        priceCents: 4500, // 45 RON
        stock: 25,
        slug: "ghiveci-ceramic-alb-modern-test",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center",
        attributes: {
          material: "ceramic",
          color: "alb",
          style: "modern",
          diameter_mm: 200,
          height_mm: 150,
          drainage_hole: true,
        },
        images: [
          {
            url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center",
            alt: "Ghiveci ceramic alb - vedere frontală",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center",
            alt: "Ghiveci ceramic alb - vedere laterală",
            isPrimary: false,
          },
        ],
      },
      {
        title: "Cutie rotundă din lemn de stejar natural",
        description: "Cutie elegantă din lemn de stejar natural, perfectă pentru aranjamente florale. Design minimalist și durabil, realizată manual cu atenție la detalii. Ideală pentru cadouri sau decor interior. Dimensiuni generoase pentru buchete mari.",
        priceCents: 8900, // 89 RON
        stock: 15,
        slug: "cutie-rotunda-lemn-stejar-test",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=800&fit=crop&crop=center",
        attributes: {
          material: "lemn",
          color: "natural",
          style: "rustic",
          diameter_mm: 250,
          height_mm: 100,
        },
        images: [
          {
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=800&fit=crop&crop=center",
            alt: "Cutie lemn stejar - vedere de sus",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=800&fit=crop&crop=center",
            alt: "Cutie lemn stejar - detalii",
            isPrimary: false,
          },
        ],
      },
    ];

    for (const productData of testProducts) {
      // Check if product already exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.slug, productData.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Product already exists: ${productData.title}`);
        continue;
      }

      // Insert product
      const [newProduct] = await db
        .insert(products)
        .values({
          sellerId: sellerId,
          categoryId: categoryId,
          slug: productData.slug,
          title: productData.title,
          description: productData.description,
          priceCents: productData.priceCents,
          stock: productData.stock,
          status: "active", // Set as active so it appears on homepage
          imageUrl: productData.imageUrl,
          attributes: productData.attributes,
        })
        .returning();

      console.log(`✅ Created product: ${productData.title} (${newProduct.id})`);

      // Insert product images
      for (const img of productData.images) {
        await db.insert(productImages).values({
          productId: newProduct.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          position: img.isPrimary ? 0 : 1,
        });
      }

      console.log(`✅ Added ${productData.images.length} images for ${productData.title}`);
    }
    
    console.log("🎉 Test products seed completed successfully!");
    console.log("\n📝 Products created:");
    console.log("  1. Ghiveci ceramic alb cu model floral modern - 45 RON");
    console.log("  2. Cutie rotundă din lemn de stejar natural - 89 RON");
    console.log("\n🔗 Access them at:");
    console.log("  - http://localhost:3000/p/[product-id]-ghiveci-ceramic-alb-modern-test");
    console.log("  - http://localhost:3000/p/[product-id]-cutie-rotunda-lemn-stejar-test");
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedTestProducts();

