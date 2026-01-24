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

async function ensureCommunicationSchema(sql) {
  try {
    console.log('🔧 Ensuring communication schema (broadcasts + deliverability)...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await sql`
      CREATE TABLE IF NOT EXISTS communication_broadcasts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind text NOT NULL DEFAULT 'announcement' CHECK (kind IN ('system', 'announcement', 'marketing')),
        channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
        status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'sending', 'sent', 'cancelled', 'rejected', 'failed')),
        name text NOT NULL,
        subject text NOT NULL,
        html text NOT NULL,
        text text,
        from_email text,
        segment jsonb,
        scheduled_at timestamptz,
        approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
        approved_at timestamptz,
        rejected_by uuid REFERENCES users(id) ON DELETE SET NULL,
        rejected_at timestamptz,
        rejection_reason text,
        send_started_at timestamptz,
        send_completed_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS communication_broadcast_recipients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        broadcast_id uuid NOT NULL REFERENCES communication_broadcasts(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        email text NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'suppressed', 'failed')),
        provider text NOT NULL DEFAULT 'resend',
        provider_message_id text,
        error text,
        sent_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT comm_broadcast_recipient_unique UNIQUE (broadcast_id, email)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS email_suppressions (
        email text PRIMARY KEY,
        reason text NOT NULL CHECK (reason IN ('bounce', 'complaint', 'manual', 'unsubscribe')),
        source text NOT NULL CHECK (source IN ('resend', 'admin', 'user')),
        note text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        revoked_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS email_deliverability_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        provider text NOT NULL DEFAULT 'resend',
        event_type text NOT NULL CHECK (event_type IN ('delivered', 'bounced', 'complained', 'opened', 'clicked', 'failed', 'unknown')),
        provider_message_id text,
        email text,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        broadcast_id uuid REFERENCES communication_broadcasts(id) ON DELETE SET NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        meta jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS comm_broadcasts_status_idx ON communication_broadcasts(status, scheduled_at);`;
    await sql`CREATE INDEX IF NOT EXISTS comm_broadcasts_created_idx ON communication_broadcasts(created_at);`;

    await sql`CREATE INDEX IF NOT EXISTS comm_broadcast_recipients_broadcast_idx ON communication_broadcast_recipients(broadcast_id, status);`;
    await sql`CREATE INDEX IF NOT EXISTS comm_broadcast_recipients_email_idx ON communication_broadcast_recipients(email);`;
    await sql`CREATE INDEX IF NOT EXISTS comm_broadcast_recipients_provider_msg_idx ON communication_broadcast_recipients(provider_message_id);`;

    // Idempotency for webhook reconciliation: provider_message_id should be unique when present.
    // Partial unique index avoids treating NULLs as duplicates.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS comm_broadcast_recipients_provider_msg_uq
      ON communication_broadcast_recipients(provider, provider_message_id)
      WHERE provider_message_id IS NOT NULL;
    `;

    await sql`CREATE INDEX IF NOT EXISTS email_suppressions_created_idx ON email_suppressions(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS email_suppressions_revoked_idx ON email_suppressions(revoked_at);`;

    await sql`CREATE INDEX IF NOT EXISTS email_deliverability_type_idx ON email_deliverability_events(event_type, occurred_at);`;
    await sql`CREATE INDEX IF NOT EXISTS email_deliverability_email_idx ON email_deliverability_events(email);`;
    await sql`CREATE INDEX IF NOT EXISTS email_deliverability_provider_msg_idx ON email_deliverability_events(provider_message_id);`;

    // Idempotency for webhook ingestion: dedupe retries by provider+message+type.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS email_deliverability_events_dedupe_uq
      ON email_deliverability_events(provider, provider_message_id, event_type)
      WHERE provider_message_id IS NOT NULL;
    `;

    console.log('✅ Communication schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure communication schema:', err.message || err);
  }
}
async function ensureUserPermissionsSchema(sql) {
  try {
    console.log('🔧 Ensuring user permissions schema...');

    // Create user_status enum if not exists
    await sql`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Add columns to users table
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS permissions jsonb,
      ADD COLUMN IF NOT EXISTS rate_limit_bypass boolean NOT NULL DEFAULT false
    `;

    console.log('✅ User permissions schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure user permissions schema:', err.message || err);
  }
}

async function ensureReservedNamesSchema(sql) {
  try {
    console.log('🔧 Ensuring reserved names schema...');

    await sql`
      CREATE TABLE IF NOT EXISTS reserved_names (
        name text PRIMARY KEY,
        reason text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // Seed initial reserved names from hardcoded list
    const reservedWords = [
      'admin', 'administrator', 'support', 'suport', 'moderator', 'mod',
      'floristmarket', 'staff', 'echipa', 'system', 'root', 'api',
      'help', 'ajutor', 'contact', 'contabilitate', 'legal'
    ];

    for (const word of reservedWords) {
      await sql`
        INSERT INTO reserved_names (name, reason)
        VALUES (${word.toLowerCase()}, 'System reserved')
        ON CONFLICT (name) DO NOTHING
      `;
    }

    console.log('✅ Reserved names schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure reserved names schema:', err.message || err);
  }
}

async function ensureRateLimitsSchema(sql) {
  try {
    console.log('🔧 Ensuring rate limits schema...');

    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key text PRIMARY KEY,
        count integer NOT NULL DEFAULT 0,
        reset_at bigint NOT NULL
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx
      ON rate_limits(reset_at)
    `;

    console.log('✅ Rate limits schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure rate limits schema:', err.message || err);
  }
}

async function ensureAdminAlertsSchema(sql) {
  try {
    console.log('🔧 Ensuring admin alerts schema...');

    // Create enums (idempotent)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
          CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'snoozed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
          CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
        END IF;
      END $$;
    `;

    // Create admin_alerts table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source text NOT NULL,
        type text NOT NULL,
        severity alert_severity NOT NULL DEFAULT 'medium',
        dedupe_key text NOT NULL,
        entity_type text,
        entity_id text,
        title text NOT NULL,
        details jsonb DEFAULT '{}',
        status alert_status NOT NULL DEFAULT 'open',
        assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        snoozed_until timestamptz,
        resolved_at timestamptz,
        resolved_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        linked_ticket_id uuid REFERENCES support_tickets(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // Partial unique index for deduplication (only one open/acknowledged/snoozed per dedupe_key)
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS admin_alerts_dedupe_key_status_idx
      ON admin_alerts(dedupe_key)
      WHERE status IN ('open', 'acknowledged', 'snoozed')
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS admin_alerts_status_idx
      ON admin_alerts(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS admin_alerts_severity_idx
      ON admin_alerts(severity)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS admin_alerts_source_idx
      ON admin_alerts(source)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS admin_alerts_assigned_idx
      ON admin_alerts(assigned_to_user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS admin_alerts_created_idx
      ON admin_alerts(created_at)
    `;

    console.log('✅ Admin alerts schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure admin alerts schema:', err.message || err);
  }
}

async function ensureSupportConsoleSchema(sql) {
  try {
    console.log('🔧 Ensuring support console schema...');

    // Create enums (idempotent)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_thread_status') THEN
          CREATE TYPE support_thread_status AS ENUM ('open', 'assigned', 'waiting', 'resolved', 'closed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_thread_source') THEN
          CREATE TYPE support_thread_source AS ENUM ('buyer_seller', 'seller_support', 'chatbot', 'whatsapp');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_moderation_status') THEN
          CREATE TYPE message_moderation_status AS ENUM ('visible', 'hidden', 'redacted', 'deleted');
        END IF;
      END $$;
    `;

    // Support threads unified inbox table
    await sql`
      CREATE TABLE IF NOT EXISTS support_threads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source support_thread_source NOT NULL,
        source_id uuid NOT NULL,
        order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
        seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
        buyer_id uuid REFERENCES users(id) ON DELETE SET NULL,
        status support_thread_status NOT NULL DEFAULT 'open',
        assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        priority support_ticket_priority NOT NULL DEFAULT 'normal',
        subject text,
        last_message_at timestamptz,
        last_message_preview text,
        message_count integer NOT NULL DEFAULT 0,
        sla_deadline timestamptz,
        sla_breach boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // Indexes for support_threads
    await sql`CREATE INDEX IF NOT EXISTS support_threads_source_idx ON support_threads(source, source_id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS support_threads_source_id_unique ON support_threads(source, source_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_status_idx ON support_threads(status)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_assigned_idx ON support_threads(assigned_to_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_order_idx ON support_threads(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_seller_idx ON support_threads(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_buyer_idx ON support_threads(buyer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_last_message_idx ON support_threads(last_message_at)`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_sla_deadline_idx ON support_threads(sla_deadline) WHERE sla_breach = false AND status NOT IN ('resolved', 'closed')`;
    await sql`CREATE INDEX IF NOT EXISTS support_threads_priority_status_idx ON support_threads(priority, status)`;

    // Support thread tags table
    await sql`
      CREATE TABLE IF NOT EXISTS support_thread_tags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id uuid NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
        tag text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS support_thread_tags_thread_idx ON support_thread_tags(thread_id)`;
    await sql`CREATE INDEX IF NOT EXISTS support_thread_tags_tag_idx ON support_thread_tags(tag)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS support_thread_tags_unique ON support_thread_tags(thread_id, tag)`;

    // Message moderation overlay table
    await sql`
      CREATE TABLE IF NOT EXISTS message_moderation (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id uuid NOT NULL UNIQUE,
        status message_moderation_status NOT NULL DEFAULT 'visible',
        redacted_body text,
        reason text,
        moderated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        moderated_at timestamptz,
        is_internal_note boolean NOT NULL DEFAULT false,
        internal_note_body text,
        internal_note_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        internal_note_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS message_moderation_message_idx ON message_moderation(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS message_moderation_status_idx ON message_moderation(status) WHERE status != 'visible'`;
    await sql`CREATE INDEX IF NOT EXISTS message_moderation_moderated_by_idx ON message_moderation(moderated_by_user_id)`;

    // Extended conversation flags table
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_flags_extended (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
        fraud_suspected boolean NOT NULL DEFAULT false,
        fraud_reason text,
        fraud_detected_at timestamptz,
        fraud_detected_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        escalated_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        escalated_at timestamptz,
        escalation_reason text,
        evidence_json jsonb DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS conversation_flags_ext_conv_idx ON conversation_flags_extended(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS conversation_flags_ext_fraud_idx ON conversation_flags_extended(fraud_suspected) WHERE fraud_suspected = true`;
    await sql`CREATE INDEX IF NOT EXISTS conversation_flags_ext_escalated_idx ON conversation_flags_extended(escalated_to_user_id) WHERE escalated_to_user_id IS NOT NULL`;

    // Chatbot queue table
    await sql`
      CREATE TABLE IF NOT EXISTS chatbot_queue (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id uuid REFERENCES support_threads(id) ON DELETE CASCADE,
        conversation_id uuid,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'pending',
        intent text,
        confidence decimal(5, 4),
        last_bot_response text,
        user_query text,
        handoff_reason text,
        assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        resolved_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        resolved_at timestamptz,
        prompt_injection_suspected boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS chatbot_queue_status_idx ON chatbot_queue(status)`;
    await sql`CREATE INDEX IF NOT EXISTS chatbot_queue_thread_idx ON chatbot_queue(thread_id)`;
    await sql`CREATE INDEX IF NOT EXISTS chatbot_queue_assigned_idx ON chatbot_queue(assigned_to_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS chatbot_queue_user_idx ON chatbot_queue(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS chatbot_queue_pending_idx ON chatbot_queue(created_at) WHERE status = 'pending'`;

    // WhatsApp message events table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_message_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        whatsapp_message_id text NOT NULL,
        thread_id uuid REFERENCES support_threads(id) ON DELETE SET NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        phone_number text,
        template_name text,
        direction text NOT NULL,
        status text NOT NULL,
        status_timestamp timestamptz,
        error_code text,
        error_message text,
        payload_json jsonb DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS whatsapp_events_message_idx ON whatsapp_message_events(whatsapp_message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS whatsapp_events_thread_idx ON whatsapp_message_events(thread_id)`;
    await sql`CREATE INDEX IF NOT EXISTS whatsapp_events_status_idx ON whatsapp_message_events(status)`;
    await sql`CREATE INDEX IF NOT EXISTS whatsapp_events_created_idx ON whatsapp_message_events(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS whatsapp_events_phone_idx ON whatsapp_message_events(phone_number)`;

    // Canned replies table
    await sql`
      CREATE TABLE IF NOT EXISTS support_canned_replies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        title text NOT NULL,
        body text NOT NULL,
        category text,
        language text NOT NULL DEFAULT 'ro',
        created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        is_active boolean NOT NULL DEFAULT true,
        usage_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS support_canned_replies_slug_idx ON support_canned_replies(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS support_canned_replies_category_idx ON support_canned_replies(category)`;
    await sql`CREATE INDEX IF NOT EXISTS support_canned_replies_active_idx ON support_canned_replies(is_active) WHERE is_active = true`;

    console.log('✅ Support console schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure support console schema:', err.message || err);
  }
}

async function ensureContentSchema(sql) {
  try {
    console.log('🔧 Ensuring content schema (blog/pages/help)...');

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // Enum: content_status
    await sql`
      DO $$
      BEGIN
        CREATE TYPE content_status AS ENUM ('draft', 'published', 'scheduled', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `;

    // Authors
    await sql`
      CREATE TABLE IF NOT EXISTS content_authors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        email text,
        avatar_url text,
        bio_md text,
        is_active boolean NOT NULL DEFAULT true,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS content_authors_slug_idx ON content_authors(slug);`;
    await sql`CREATE INDEX IF NOT EXISTS content_authors_active_idx ON content_authors(is_active);`;

    // Blog posts (snapshot)
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        slug_locked boolean NOT NULL DEFAULT false,
        author_id uuid REFERENCES content_authors(id) ON DELETE SET NULL,
        title text NOT NULL,
        excerpt text,
        cover_url text,
        body_md text,
        seo_title text,
        seo_desc text,
        status content_status NOT NULL DEFAULT 'draft',
        published_at timestamptz,
        scheduled_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts(author_id);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts(published_at);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_posts_scheduled_idx ON blog_posts(scheduled_at);`;

    // Blog post versions
    await sql`
      CREATE TABLE IF NOT EXISTS blog_post_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        version int NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        author_id uuid REFERENCES content_authors(id) ON DELETE SET NULL,
        title text NOT NULL,
        excerpt text,
        cover_url text,
        body_md text,
        seo_title text,
        seo_desc text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        published_by uuid REFERENCES users(id) ON DELETE SET NULL,
        published_at timestamptz,
        meta jsonb
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS blog_post_versions_post_idx ON blog_post_versions(post_id);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS blog_post_versions_post_version_uq ON blog_post_versions(post_id, version);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_post_versions_status_idx ON blog_post_versions(post_id, status);`;
    await sql`CREATE INDEX IF NOT EXISTS blog_post_versions_published_idx ON blog_post_versions(post_id, published_at);`;

    // Static pages
    await sql`
      CREATE TABLE IF NOT EXISTS static_pages (
        key text PRIMARY KEY,
        title text NOT NULL,
        body_md text,
        status content_status NOT NULL DEFAULT 'draft',
        published_at timestamptz,
        scheduled_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS static_pages_status_idx ON static_pages(status);`;
    await sql`CREATE INDEX IF NOT EXISTS static_pages_published_idx ON static_pages(published_at);`;

    await sql`
      CREATE TABLE IF NOT EXISTS static_page_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        page_key text NOT NULL REFERENCES static_pages(key) ON DELETE CASCADE,
        version int NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        title text NOT NULL,
        body_md text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        published_by uuid REFERENCES users(id) ON DELETE SET NULL,
        published_at timestamptz,
        meta jsonb
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS static_page_versions_page_idx ON static_page_versions(page_key);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS static_page_versions_page_version_uq ON static_page_versions(page_key, version);`;
    await sql`CREATE INDEX IF NOT EXISTS static_page_versions_status_idx ON static_page_versions(page_key, status);`;
    await sql`CREATE INDEX IF NOT EXISTS static_page_versions_published_idx ON static_page_versions(page_key, published_at);`;

    // Help Center
    await sql`
      CREATE TABLE IF NOT EXISTS help_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        title text NOT NULL,
        description text,
        position int NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS help_categories_slug_idx ON help_categories(slug);`;
    await sql`CREATE INDEX IF NOT EXISTS help_categories_active_idx ON help_categories(is_active);`;

    await sql`
      CREATE TABLE IF NOT EXISTS help_articles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
        slug text NOT NULL,
        slug_locked boolean NOT NULL DEFAULT false,
        title text NOT NULL,
        summary text,
        body_md text,
        status content_status NOT NULL DEFAULT 'draft',
        published_at timestamptz,
        scheduled_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS help_articles_category_idx ON help_articles(category_id);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS help_articles_category_slug_uq ON help_articles(category_id, slug);`;
    await sql`CREATE INDEX IF NOT EXISTS help_articles_status_idx ON help_articles(status);`;
    await sql`CREATE INDEX IF NOT EXISTS help_articles_published_idx ON help_articles(published_at);`;

    await sql`
      CREATE TABLE IF NOT EXISTS help_article_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id uuid NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
        version int NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        category_id uuid REFERENCES help_categories(id) ON DELETE SET NULL,
        slug text NOT NULL,
        title text NOT NULL,
        summary text,
        body_md text,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        published_by uuid REFERENCES users(id) ON DELETE SET NULL,
        published_at timestamptz,
        meta jsonb
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS help_article_versions_article_idx ON help_article_versions(article_id);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS help_article_versions_article_version_uq ON help_article_versions(article_id, version);`;
    await sql`CREATE INDEX IF NOT EXISTS help_article_versions_published_idx ON help_article_versions(article_id, published_at);`;

    await sql`
      CREATE TABLE IF NOT EXISTS help_article_tags (
        article_id uuid NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
        tag text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS help_article_tags_article_idx ON help_article_tags(article_id);`;
    await sql`CREATE INDEX IF NOT EXISTS help_article_tags_tag_idx ON help_article_tags(tag);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS help_article_tags_article_tag_uq ON help_article_tags(article_id, tag);`;

    await sql`
      CREATE TABLE IF NOT EXISTS help_analytics_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type text NOT NULL,
        article_id uuid REFERENCES help_articles(id) ON DELETE SET NULL,
        query text,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        session_id text,
        meta jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS help_analytics_events_type_idx ON help_analytics_events(event_type);`;
    await sql`CREATE INDEX IF NOT EXISTS help_analytics_events_article_idx ON help_analytics_events(article_id);`;
    await sql`CREATE INDEX IF NOT EXISTS help_analytics_events_created_idx ON help_analytics_events(created_at);`;

    console.log('✅ Content schema ensured');
  } catch (err) {
    console.warn('⚠️  Could not ensure content schema:', err.message || err);
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
    await ensureCommunicationSchema(sql);
    await ensureUserPermissionsSchema(sql);
    await ensureReservedNamesSchema(sql);
    await ensureRateLimitsSchema(sql);
    await ensureAdminAlertsSchema(sql);
    await ensureSupportConsoleSchema(sql);
    await ensureContentSchema(sql);

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
