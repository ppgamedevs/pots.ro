#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function checkOrdersTable(sql) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'orders'
      ) as exists
    `;
    return result[0].exists;
  } catch (err) {
    return false;
  }
}

async function ensureInternalNotesColumn(sql) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'seller_applications'
          AND column_name = 'internal_notes'
      ) as exists
    `;

    if (result[0]?.exists) {
      console.log('✅ seller_applications.internal_notes already exists');
      return;
    }

    console.log('🔧 Adding seller_applications.internal_notes column...');
    await sql`
      ALTER TABLE seller_applications
      ADD COLUMN IF NOT EXISTS internal_notes TEXT
    `;
    console.log('✅ Added seller_applications.internal_notes');
  } catch (err) {
    // If the table doesn't exist yet, ignore and continue
    console.warn('⚠️  Could not ensure internal_notes column (table may not exist yet):', err.message || err);
  }
}

async function ensureSellerApplicationStatusEvents(sql) {
  try {
    console.log('🔧 Ensuring seller application status events (audit)...');

    // Needed for gen_random_uuid()
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_application_status_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL REFERENCES seller_applications(id) ON DELETE CASCADE,
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        from_status seller_application_status NOT NULL,
        to_status seller_application_status NOT NULL,
        public_message text,
        internal_message text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS seller_app_status_events_app_idx
      ON seller_application_status_events(application_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_app_status_events_created_idx
      ON seller_application_status_events(application_id, created_at);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_app_status_events_actor_idx
      ON seller_application_status_events(actor_id);
    `;

    console.log('✅ Seller application status events ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure seller application status events (tables may not exist yet):', err.message || err);
  }
}

  async function ensureSellerActions(sql) {
    try {
      console.log('🔧 Ensuring seller actions (audit)...');

      // Needed for gen_random_uuid()
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

      await sql`
        CREATE TABLE IF NOT EXISTS seller_actions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
          action text NOT NULL,
          message text,
          meta jsonb,
          admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS seller_actions_seller_id_idx
        ON seller_actions(seller_id);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS seller_actions_created_idx
        ON seller_actions(created_at);
      `;

      console.log('✅ Seller actions ensured');
    } catch (err) {
      console.warn('⚠️  Could not ensure seller actions (tables may not exist yet):', err.message || err);
    }
  }

async function ensureSellerCompliance(sql) {
  try {
    console.log('🔧 Ensuring seller compliance columns...');

    await sql`
      ALTER TABLE sellers
      ADD COLUMN IF NOT EXISTS verified_badge boolean NOT NULL DEFAULT false;
    `;
    await sql`
      ALTER TABLE sellers
      ADD COLUMN IF NOT EXISTS cui_validated_at timestamptz;
    `;
    await sql`
      ALTER TABLE sellers
      ADD COLUMN IF NOT EXISTS iban_validated_at timestamptz;
    `;
    await sql`
      ALTER TABLE sellers
      ADD COLUMN IF NOT EXISTS kyc_reverification_requested_at timestamptz;
    `;

    console.log('✅ Seller compliance columns ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure seller compliance columns (tables may not exist yet):', err.message || err);
  }
}

async function ensureSellerKycDocuments(sql) {
  try {
    console.log('🔧 Ensuring seller KYC documents...');

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_kyc_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        doc_type text NOT NULL,
        filename text NOT NULL,
        mime_type text NOT NULL,
        size_bytes int NOT NULL,
        encrypted_data bytea NOT NULL,
        encryption_iv bytea NOT NULL,
        encryption_tag bytea NOT NULL,
        status text NOT NULL DEFAULT 'uploaded',
        uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at timestamptz,
        review_message text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS seller_kyc_documents_seller_idx
      ON seller_kyc_documents(seller_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_kyc_documents_type_idx
      ON seller_kyc_documents(seller_id, doc_type);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_kyc_documents_status_idx
      ON seller_kyc_documents(seller_id, status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_kyc_documents_created_idx
      ON seller_kyc_documents(seller_id, created_at);
    `;

    console.log('✅ Seller KYC documents ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure seller KYC documents (tables may not exist yet):', err.message || err);
  }
}

async function ensureSellerPageVersions(sql) {
  try {
    console.log('🔧 Ensuring seller page versions...');

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_page_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        version int NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        about_md text,
        seo_title text,
        seo_desc text,
        logo_url text,
        banner_url text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        published_by uuid REFERENCES users(id) ON DELETE SET NULL,
        published_at timestamptz,
        meta jsonb,
        CONSTRAINT seller_page_versions_seller_version_uq UNIQUE (seller_id, version)
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS seller_page_versions_seller_idx
      ON seller_page_versions(seller_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_page_versions_status_idx
      ON seller_page_versions(seller_id, status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_page_versions_published_idx
      ON seller_page_versions(seller_id, published_at);
    `;

    console.log('✅ Seller page versions ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure seller page versions (tables may not exist yet):', err.message || err);
  }
}

async function ensureSupportSchema(sql) {
  try {
    console.log('🔧 Ensuring support schema (notes/tickets/conversations)...');

    // Needed for gen_random_uuid()
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // Enums (idempotent)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status') THEN
          CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_on_seller', 'resolved', 'closed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_priority') THEN
          CREATE TYPE support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
        END IF;
      END $$;
    `;

    // Tables
    await sql`
      CREATE TABLE IF NOT EXISTS seller_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS seller_notes_seller_idx ON seller_notes(seller_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS seller_notes_created_idx ON seller_notes(seller_id, created_at);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
        status support_ticket_status NOT NULL DEFAULT 'open',
        priority support_ticket_priority NOT NULL DEFAULT 'normal',
        title text NOT NULL,
        description text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS support_tickets_seller_idx ON support_tickets(seller_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets(priority);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_tickets_updated_idx ON support_tickets(updated_at);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_idx ON support_ticket_messages(ticket_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_conversations_seller_idx ON support_conversations(seller_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS support_conversation_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
        author_id uuid REFERENCES users(id) ON DELETE SET NULL,
        author_role text NOT NULL,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS support_conversation_messages_conv_idx ON support_conversation_messages(conversation_id);
    `;

    console.log('✅ Support schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure support schema (tables may not exist yet):', err.message || err);
  }
}

async function runMigration() {
  let sql;
  try {
    const postgres = require('postgres');
    const { drizzle } = require('drizzle-orm/postgres-js');
    const { migrate } = require('drizzle-orm/postgres-js/migrator');

    const DATABASE_URL = 
      process.env.POSTGRES_DATABASE_URL ||
      process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_POSTGRES_URL ||
      process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL;

    if (!DATABASE_URL) {
      console.error('❌ No DATABASE_URL found in environment');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 30,
      onnotice: () => {},
    });

    // Test connection
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (connErr) {
      console.error('❌ Cannot connect to database:', connErr.message);
      process.exit(1);
    }

    // Always attempt safe, idempotent schema tweaks
    await ensureInternalNotesColumn(sql);
    await ensureSupportSchema(sql);
    await ensureSellerApplicationStatusEvents(sql);
      await ensureSellerActions(sql);
    await ensureSellerCompliance(sql);
    await ensureSellerKycDocuments(sql);
    await ensureSellerPageVersions(sql);

    // Check if orders table already exists
    console.log('🔍 Checking if orders table exists...');
    const tableExists = await checkOrdersTable(sql);
    
    if (tableExists) {
      console.log('✅ Orders table already exists!');
      console.log('✅ Migration already applied. Skipping migration scripts.');
      await sql.end();
      process.exit(0);
    }

    console.log('� Orders table not found. Running Drizzle migrations...');
    const db = drizzle(sql);
    
    try {
      const migrationsFolder = path.join(process.cwd(), 'drizzle');
      await migrate(db, { migrationsFolder });
      console.log('✅ Migrations completed successfully!');
    } catch (migrateErr) {
      console.warn('⚠️  Migration script error:', migrateErr.message);
      
      // Even if migration script fails, check if table exists now
      console.log('🔍 Double-checking if orders table was created...');
      const tableExistsNow = await checkOrdersTable(sql);
      
      if (tableExistsNow) {
        console.log('✅ Orders table exists - continuing despite migration error');
        await sql.end();
        process.exit(0);
      }
      
      // If still no table, try to create tables directly
      console.log('📋 Attempting direct table creation...');
      const createTablesScript = require('./create-tables.js');
      // Let create-tables.js handle it
      await sql.end();
      process.exit(0);
    }

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

runMigration();
