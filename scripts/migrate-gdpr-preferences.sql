-- Migration script pentru gdpr_preferences
-- Migrează de la user_id la email

-- Pas 1: Verifică dacă tabelul există cu coloana user_id
DO $$
BEGIN
  -- Dacă există coloana user_id, migrează datele
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'gdpr_preferences' 
    AND column_name = 'user_id'
  ) THEN
    -- Adaugă coloana email dacă nu există
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'gdpr_preferences' 
      AND column_name = 'email'
    ) THEN
      ALTER TABLE gdpr_preferences ADD COLUMN email TEXT;
      
      -- Migrează datele din user_id în email (folosind users.email)
      UPDATE gdpr_preferences gp
      SET email = u.email
      FROM users u
      WHERE gp.user_id = u.id;
      
      -- Șterge coloana user_id și constraint-urile vechi
      ALTER TABLE gdpr_preferences DROP CONSTRAINT IF EXISTS gdpr_preferences_user_id_fkey;
      DROP INDEX IF EXISTS gdpr_preferences_user_idx;
      
      ALTER TABLE gdpr_preferences DROP COLUMN user_id;
      
      -- Face email NOT NULL și UNIQUE
      ALTER TABLE gdpr_preferences ALTER COLUMN email SET NOT NULL;
      ALTER TABLE gdpr_preferences ADD CONSTRAINT gdpr_preferences_email_unique UNIQUE(email);
      
      -- Creează index-ul nou
      CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx ON gdpr_preferences(email);
      
      RAISE NOTICE 'Migration completed: Migrated from user_id to email';
    ELSE
      RAISE NOTICE 'Email column already exists';
    END IF;
  ELSE
    -- Dacă nu există coloana user_id, doar creează tabelul corect dacă nu există
    CREATE TABLE IF NOT EXISTS gdpr_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      consent_type TEXT NOT NULL CHECK (consent_type IN ('necessary', 'all')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS gdpr_preferences_email_idx ON gdpr_preferences(email);
    
    RAISE NOTICE 'Table created with email column';
  END IF;
END $$;
