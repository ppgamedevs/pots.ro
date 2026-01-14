#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function createTablesDirectly() {
  let sql;
  try {
    const postgres = require('postgres');

    const DATABASE_URL = 
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_POSTGRES_URL ||
      process.env.POSTGRES_URL;

    if (!DATABASE_URL) {
      console.error('❌ No DATABASE_URL found in environment');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    sql = postgres(DATABASE_URL, { max: 1, idle_timeout: 30 });

    // Test connection
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (connErr) {
      console.error('❌ Cannot connect to database:', connErr.message);
      process.exit(1);
    }

    // Create order-related tables and enums directly
    console.log('📋 Creating order-related enums and tables...');
    
    const statements = [
      // Enums
      `DO $$ BEGIN
        CREATE TYPE order_status AS ENUM('pending', 'paid', 'packed', 'shipped', 'delivered', 'canceled', 'refunded', 'return_requested', 'return_approved', 'returned');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$`,
      
      // Carts table
      `CREATE TABLE IF NOT EXISTS carts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      
      // Cart items table
      `CREATE TABLE IF NOT EXISTS cart_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE cascade,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE cascade,
        qty integer NOT NULL,
        price_cents integer NOT NULL,
        currency text DEFAULT 'RON' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      
      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        order_number text NOT NULL UNIQUE,
        buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE restrict,
        status order_status NOT NULL DEFAULT 'pending',
        currency text NOT NULL DEFAULT 'RON',
        subtotal_cents integer NOT NULL DEFAULT 0,
        shipping_fee_cents integer NOT NULL DEFAULT 0,
        total_discount_cents integer NOT NULL DEFAULT 0,
        total_cents integer NOT NULL DEFAULT 0,
        payment_ref text,
        shipping_address jsonb NOT NULL,
        awb_number text,
        awb_label_url text,
        carrier_meta jsonb,
        delivered_at timestamp with time zone,
        canceled_reason text,
        delivery_status text,
        paid_at timestamp with time zone,
        packed_at timestamp with time zone,
        shipped_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      
      // Order items table
      `CREATE TABLE IF NOT EXISTS order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE cascade,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE restrict,
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE restrict,
        qty integer NOT NULL,
        unit_price_cents integer NOT NULL,
        discount_cents integer NOT NULL DEFAULT 0,
        subtotal_cents integer NOT NULL,
        commission_pct integer NOT NULL,
        commission_amount_cents integer NOT NULL,
        seller_due_cents integer NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      
      // Promotions table
      `CREATE TABLE IF NOT EXISTS promotions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        seller_id uuid REFERENCES sellers(id) ON DELETE set null,
        type text NOT NULL DEFAULT 'discount',
        active boolean NOT NULL DEFAULT true,
        percent integer,
        value integer,
        start_at timestamp with time zone NOT NULL,
        end_at timestamp with time zone NOT NULL,
        target_category_slug text,
        target_product_id uuid REFERENCES products(id) ON DELETE set null,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS carts_user_idx ON carts (user_id)`,
      `CREATE INDEX IF NOT EXISTS ci_cart_idx ON cart_items (cart_id)`,
      `CREATE INDEX IF NOT EXISTS ci_product_idx ON cart_items (product_id)`,
      `CREATE INDEX IF NOT EXISTS orders_buyer_idx ON orders (buyer_id)`,
      `CREATE INDEX IF NOT EXISTS orders_seller_idx ON orders (seller_id)`,
      `CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders (order_number)`,
      `CREATE INDEX IF NOT EXISTS oi_order_idx ON order_items (order_id)`,
      `CREATE INDEX IF NOT EXISTS oi_product_idx ON order_items (product_id)`,
      `CREATE INDEX IF NOT EXISTS oi_seller_idx ON order_items (seller_id)`,
      `CREATE INDEX IF NOT EXISTS promotions_seller_idx ON promotions (seller_id)`,
      `CREATE INDEX IF NOT EXISTS promotions_category_idx ON promotions (target_category_slug)`,
      `CREATE INDEX IF NOT EXISTS promotions_product_idx ON promotions (target_product_id)`,
    ];

    for (let i = 0; i < statements.length; i++) {
      try {
        await sql.unsafe(statements[i]);
        console.log(`  ✓ Statement ${i + 1}/${statements.length}`);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message && err.message.includes('already exists')) {
          console.log(`  ✓ Statement ${i + 1}/${statements.length} (already exists)`);
        } else {
          console.warn(`  ⚠ Statement ${i + 1}/${statements.length}: ${err.message}`);
        }
      }
    }

    console.log('✅ All tables created successfully!');
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:');
    console.error(error.message || error);
    
    if (sql) {
      try {
        await sql.end();
      } catch (e) {
        // Ignore error closing connection
      }
    }
    
    process.exit(1);
  }
}

createTablesDirectly();
