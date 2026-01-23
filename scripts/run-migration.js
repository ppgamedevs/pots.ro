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

async function ensureCatalogAdminSchema(sql) {
  try {
    console.log('🔧 Ensuring catalog admin schema (categories/products/images/search tuning)...');

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // Categories: lock slugs
    await sql`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS slug_locked boolean NOT NULL DEFAULT true;
    `;

    // Category redirects
    await sql`
      CREATE TABLE IF NOT EXISTS category_redirects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_slug text NOT NULL UNIQUE,
        to_slug text NOT NULL,
        reason text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS category_redirects_from_idx ON category_redirects(from_slug);`;
    await sql`CREATE INDEX IF NOT EXISTS category_redirects_to_idx ON category_redirects(to_slug);`;

    // Products: featured + SEO override
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title text;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_desc text;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);`;

    // Product images: moderation fields
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS is_blurred boolean NOT NULL DEFAULT false;`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS report_count int NOT NULL DEFAULT 0;`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS moderated_at timestamptz;`;
    await sql`CREATE INDEX IF NOT EXISTS product_images_status_idx ON product_images(moderation_status);`;
    await sql`CREATE INDEX IF NOT EXISTS product_images_reports_idx ON product_images(report_count);`;

    // Admin audit log (generic)
    await sql`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        actor_role text,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        message text,
        meta jsonb,
        prev_hash text,
        entry_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS prev_hash text;`;
    await sql`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS entry_hash text;`;
    await sql`CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_idx ON admin_audit_logs(entity_type, entity_id);`;
    await sql`CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON admin_audit_logs(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON admin_audit_logs(actor_id);`;

    // Admin PII grants (timeboxed reveal with reason)
    await sql`
      CREATE TABLE IF NOT EXISTS admin_pii_grants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        fields jsonb NOT NULL,
        reason text NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS admin_pii_grants_actor_idx ON admin_pii_grants(actor_id);`;
    await sql`CREATE INDEX IF NOT EXISTS admin_pii_grants_entity_idx ON admin_pii_grants(entity_type, entity_id);`;
    await sql`CREATE INDEX IF NOT EXISTS admin_pii_grants_expires_idx ON admin_pii_grants(expires_at);`;

    // Search tuning
    await sql`
      CREATE TABLE IF NOT EXISTS search_query_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        q text NOT NULL,
        results_count int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS search_query_logs_created_idx ON search_query_logs(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS search_query_logs_q_idx ON search_query_logs(q);`;

    await sql`
      CREATE TABLE IF NOT EXISTS search_synonyms (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        term text NOT NULL UNIQUE,
        synonyms jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS search_synonyms_term_idx ON search_synonyms(term);`;

    await sql`
      CREATE TABLE IF NOT EXISTS search_boosts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        term text NOT NULL UNIQUE,
        boost int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS search_boosts_term_idx ON search_boosts(term);`;

    await sql`
      CREATE TABLE IF NOT EXISTS search_stopwords (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        term text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS search_stopwords_term_idx ON search_stopwords(term);`;

    await sql`
      CREATE TABLE IF NOT EXISTS search_tuning_settings (
        id text PRIMARY KEY,
        enabled boolean NOT NULL DEFAULT false,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS search_tuning_settings_enabled_idx ON search_tuning_settings(enabled);`;

    // Ensure singleton row exists
    await sql`
      INSERT INTO search_tuning_settings(id, enabled)
      VALUES ('default', false)
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('✅ Catalog admin schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure catalog admin schema (tables may not exist yet):', err.message || err);
  }
}

async function ensureCommissionRates(sql) {
  try {
    console.log('🔧 Ensuring commission rates (versioned/effective)...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS commission_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
        pct_bps int NOT NULL,
        effective_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
        approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
        approved_at timestamptz,
        note text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS commission_rates_seller_effective_idx
      ON commission_rates(seller_id, effective_at);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS commission_rates_status_effective_idx
      ON commission_rates(status, effective_at);
    `;

    console.log('✅ Commission rates ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure commission rates:', err.message || err);
  }
}

async function ensureSettingsTable(sql) {
  try {
    console.log('🔧 Ensuring settings (key-value, staged rollout)...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text NOT NULL UNIQUE,
        value text NOT NULL,
        staged_value text,
        staged_effective_at timestamptz,
        staged_at timestamptz,
        staged_by text,
        description text,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by text
      );
    `;

    // Ensure new columns exist if the table predates them
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS staged_value text;`;
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS staged_effective_at timestamptz;`;
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS staged_at timestamptz;`;
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS staged_by text;`;

    await sql`CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);`;
    await sql`CREATE INDEX IF NOT EXISTS settings_updated_idx ON settings(updated_at);`;

    console.log('✅ Settings ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure settings:', err.message || err);
  }
}

async function ensureFeatureFlags(sql) {
  try {
    console.log('🔧 Ensuring feature flags...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS feature_flags (
        key text PRIMARY KEY,
        enabled boolean NOT NULL DEFAULT false,
        rollout_pct int NOT NULL DEFAULT 0,
        segments jsonb,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS feature_flags_updated_idx ON feature_flags(updated_at);`;
    console.log('✅ Feature flags ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure feature flags:', err.message || err);
  }
}

async function ensureManagedEmailTemplates(sql) {
  try {
    console.log('🔧 Ensuring managed email templates...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS managed_email_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        template_key text NOT NULL,
        version int NOT NULL,
        subject text NOT NULL,
        html text NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        note text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        activated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        activated_at timestamptz,
        CONSTRAINT managed_email_templates_key_version_uq UNIQUE (template_key, version)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS managed_email_templates_key_idx ON managed_email_templates(template_key);`;
    await sql`CREATE INDEX IF NOT EXISTS managed_email_templates_status_idx ON managed_email_templates(template_key, status);`;

    console.log('✅ Managed email templates ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure managed email templates:', err.message || err);
  }
}

async function ensureGdprCompliance(sql) {
  try {
    console.log('🔧 Ensuring GDPR compliance (consent proofs + DSAR requests)...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS gdpr_consent_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email_hash text NOT NULL,
        email_domain text,
        email_masked text,
        consent_type text NOT NULL,
        legal_basis text NOT NULL,
        source text NOT NULL,
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        ip text,
        ua text,
        policy_version text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS gdpr_consent_events_email_hash_idx ON gdpr_consent_events(email_hash);`;
    await sql`CREATE INDEX IF NOT EXISTS gdpr_consent_events_created_idx ON gdpr_consent_events(created_at);`;

    await sql`
      CREATE TABLE IF NOT EXISTS gdpr_dsr_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL,
        status text NOT NULL,
        email text NOT NULL,
        email_hash text NOT NULL,
        email_domain text,
        email_masked text,
        requested_ip text,
        requested_ua text,
        requested_at timestamptz NOT NULL DEFAULT now(),
        verify_expires_at timestamptz,
        verified_at timestamptz,
        due_at timestamptz,
        completed_at timestamptz,
        handled_by uuid REFERENCES users(id) ON DELETE SET NULL,
        notes text,
        meta jsonb
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS gdpr_dsr_requests_email_hash_idx ON gdpr_dsr_requests(email_hash);`;
    await sql`CREATE INDEX IF NOT EXISTS gdpr_dsr_requests_status_idx ON gdpr_dsr_requests(status);`;
    await sql`CREATE INDEX IF NOT EXISTS gdpr_dsr_requests_requested_at_idx ON gdpr_dsr_requests(requested_at);`;

    console.log('✅ GDPR compliance ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure GDPR compliance tables:', err.message || err);
  }
}

async function ensureProductLocks(sql) {
  try {
    console.log('🔧 Ensuring product locks (price/stock lockouts)...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS product_locks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        scope text NOT NULL CHECK (scope IN ('price', 'stock', 'all')),
        locked_until timestamptz NOT NULL,
        reason text NOT NULL,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        revoked_by uuid REFERENCES users(id) ON DELETE SET NULL,
        revoked_reason text
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS product_locks_product_idx ON product_locks(product_id);`;
    await sql`CREATE INDEX IF NOT EXISTS product_locks_until_idx ON product_locks(locked_until);`;
    await sql`CREATE INDEX IF NOT EXISTS product_locks_revoked_idx ON product_locks(product_id, revoked_at);`;

    console.log('✅ Product locks ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure product locks (tables may not exist yet):', err.message || err);
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
    await ensureCatalogAdminSchema(sql);
    await ensureCommissionRates(sql);
    await ensureSettingsTable(sql);
    await ensureFeatureFlags(sql);
    await ensureManagedEmailTemplates(sql);
    await ensureGdprCompliance(sql);
    await ensureProductLocks(sql);

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
