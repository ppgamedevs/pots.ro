import { config } from "dotenv";
import { db } from "../db/index";
import { categories } from "../db/schema/core";
import { eq } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });
config();

// Import env normalization after loading .env
import "../lib/env";

const seedCategories = [
  'Ghivece',
  'Cutii florale', 
  'Accesorii',
  'Ambalaje',
  'Oaze/Spumă florală',
  'Panglici',
  'Hârtie',
  'Sfori & Șnururi',
  'Decoruri',
  'Vaze',
  'Suporturi',
  'Unelte'
];

async function seed() {
  console.log("🌱 Starting seed...");
  
  try {
    for (const categoryName of seedCategories) {
      const slug = categoryName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Check if category already exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(categories).values({
          name: categoryName,
          slug: slug,
          position: seedCategories.indexOf(categoryName),
        });
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryName}`);
      }
    }
    
    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();

