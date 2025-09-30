-- Migration: Create e-commerce schema with all tables, indexes, and triggers
-- Generated for Vercel Postgres (Neon)

-- Create enum for product status
CREATE TYPE "product_status" AS ENUM('draft', 'active', 'archived');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL DEFAULT 'buyer',
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("role" IN ('buyer','seller','admin'))
);

-- Create sellers table
CREATE TABLE IF NOT EXISTS "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"brand_name" text NOT NULL,
	"about" text,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"seller_id" uuid NOT NULL,
	"category_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"currency" text NOT NULL DEFAULT 'RON',
	"stock" integer NOT NULL DEFAULT 0,
	"status" "product_status" NOT NULL DEFAULT 'draft',
	"attributes" jsonb NOT NULL DEFAULT '{}',
	"search_tsv" text,
	"image_url" text,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"position" integer DEFAULT 0,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create seller_pages table
CREATE TABLE IF NOT EXISTS "seller_pages" (
	"seller_id" uuid PRIMARY KEY,
	"about_md" text,
	"seo_title" text,
	"seo_desc" text,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create sessions table for Lucia auth
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "sellers_slug_unique" ON "sellers" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");

-- Create indexes
CREATE INDEX IF NOT EXISTS "sellers_user_idx" ON "sellers" ("user_id");
CREATE INDEX IF NOT EXISTS "sellers_slug_idx" ON "sellers" ("slug");
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" ("parent_id");
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "idx_products_slug" ON "products" ("slug");
CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products" ("status");
CREATE INDEX IF NOT EXISTS "idx_products_seller" ON "products" ("seller_id");
CREATE INDEX IF NOT EXISTS "product_images_product_idx" ON "product_images" ("product_id");

-- Create GIN index for full-text search
-- Ensure tsvector column type for proper GIN index
ALTER TABLE "products" ALTER COLUMN "search_tsv" TYPE tsvector USING to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''));
CREATE INDEX IF NOT EXISTS "idx_products_search_tsv" ON "products" USING GIN ("search_tsv");

-- Create foreign key constraints
DO $$ BEGIN
 ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "seller_pages" ADD CONSTRAINT "seller_pages_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_pages_updated_at ON seller_pages;
CREATE TRIGGER update_seller_pages_updated_at BEFORE UPDATE ON seller_pages
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
DROP TRIGGER IF EXISTS update_products_search_tsv_trigger ON products;
CREATE TRIGGER update_products_search_tsv_trigger 
  BEFORE INSERT OR UPDATE OF title, description ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_search_tsv();

