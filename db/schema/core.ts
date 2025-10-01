import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("buyer").$type<'buyer' | 'seller' | 'admin'>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Sellers table
export const sellers = pgTable("sellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  brandName: text("brand_name").notNull(),
  about: text("about"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sellersUserIdx: index("sellers_user_idx").on(table.userId),
  sellersSlugIdx: index("sellers_slug_idx").on(table.slug),
  sellersUserUnique: uniqueIndex("sellers_user_unique").on(table.userId),
}));

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoriesParentIdx: index("categories_parent_idx").on(table.parentId),
  categoriesSlugIdx: index("categories_slug_idx").on(table.slug),
}));

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("RON"),
  stock: integer("stock").notNull().default(0),
  status: productStatusEnum("status").notNull().default("draft"),
  attributes: jsonb("attributes").notNull().default({}),
  searchTsv: text("search_tsv"), // tsvector column (converted in migration)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxProductsSlug: index("idx_products_slug").on(table.slug),
  idxProductsStatus: index("idx_products_status").on(table.status),
  idxProductsSeller: index("idx_products_seller").on(table.sellerId),
}));

// Product images table
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productImagesProductIdx: index("product_images_product_idx").on(table.productId),
}));

// Seller pages table
export const sellerPages = pgTable("seller_pages", {
  sellerId: uuid("seller_id").primaryKey().references(() => sellers.id, { onDelete: "cascade" }),
  aboutMd: text("about_md"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Cart tables
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  currency: text("currency").notNull().default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartsUserIdx: index("carts_user_idx").on(table.userId),
  cartsSessionIdx: index("carts_session_idx").on(table.sessionId),
  cartsUserUnique: uniqueIndex("carts_user_unique").on(table.userId).where(sql`user_id IS NOT NULL`),
  cartsSessionUnique: uniqueIndex("carts_session_unique").on(table.sessionId).where(sql`session_id IS NOT NULL`),
}));

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  qty: integer("qty").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartItemsCartIdx: index("cart_items_cart_idx").on(table.cartId),
  cartItemsProductIdx: index("cart_items_product_idx").on(table.productId),
  cartItemsUnique: uniqueIndex("cart_items_unique").on(table.cartId, table.productId),
}));

// Sessions table for Lucia auth
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// SQL for triggers and additional indexes
export const createTriggersAndIndexes = sql`
  -- Add foreign key constraint for categories self-reference
  ALTER TABLE categories ADD CONSTRAINT fk_categories_parent 
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

  -- Add cart constraints
  ALTER TABLE carts ADD CONSTRAINT carts_who 
    CHECK ( (user_id IS NOT NULL) OR (session_id IS NOT NULL) );
  
  ALTER TABLE cart_items ADD CONSTRAINT cart_items_qty_positive 
    CHECK (qty > 0);

  -- Create pg_trgm extension for trigram search
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Triggers for updated_at
  CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_seller_pages_updated_at BEFORE UPDATE ON seller_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Function to update search_tsv
  CREATE OR REPLACE FUNCTION update_products_search_tsv()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_tsv = 
      setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
      setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B');
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Trigger for search_tsv
  CREATE TRIGGER update_products_search_tsv_trigger 
    BEFORE INSERT OR UPDATE OF title, description ON products
    FOR EACH ROW EXECUTE FUNCTION update_products_search_tsv();

  -- Create GIN index for full-text search
  CREATE INDEX IF NOT EXISTS idx_products_search_tsv ON products USING GIN (search_tsv);

  -- Create partial unique index for product_images is_primary
  CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary
    ON product_images(product_id)
    WHERE is_primary = true;

  -- Create products search view
  CREATE OR REPLACE VIEW products_search_v AS
    SELECT p.id, p.slug, p.title, p.description, p.price_cents, p.currency,
           p.image_url, p.status, p.category_id, p.search_tsv
    FROM products p
    WHERE p.status = 'active';
`;

