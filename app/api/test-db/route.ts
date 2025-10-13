import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute('SELECT 1 as test');
    console.log('Database connection test:', result);
    
    // Try to create auth_otp table if it doesn't exist
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS auth_otp (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          code_hash VARCHAR(255) NOT NULL,
          magic_token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          consumed_at TIMESTAMPTZ,
          ip TEXT,
          ua TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(`
        CREATE INDEX IF NOT EXISTS auth_otp_email_expires_idx ON auth_otp(email, expires_at)
      `);
      
      await db.execute(`
        CREATE INDEX IF NOT EXISTS auth_otp_email_created_idx ON auth_otp(email, created_at)
      `);
      
      // Create auth_audit table for logging
      await db.execute(`
        CREATE TABLE IF NOT EXISTS auth_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          kind TEXT NOT NULL,
          email TEXT,
          user_id UUID REFERENCES users(id),
          ip TEXT,
          ua TEXT,
          meta JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(`
        CREATE INDEX IF NOT EXISTS auth_audit_kind_idx ON auth_audit(kind)
      `);
      
      await db.execute(`
        CREATE INDEX IF NOT EXISTS auth_audit_email_idx ON auth_audit(email)
      `);
      
      // Add name column to users table if it doesn't exist
      await db.execute(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT
      `);
      
      // Fix sessions table structure
      await db.execute(`
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_token_hash VARCHAR(255)
      `);
      
      await db.execute(`
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip TEXT
      `);
      
      await db.execute(`
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ua TEXT
      `);
      
      await db.execute(`
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ
      `);
      
      // Fix sessions table id column type
      await db.execute(`
        ALTER TABLE sessions ALTER COLUMN id TYPE UUID USING id::UUID
      `);
      
      console.log('Auth tables created successfully');
    } catch (error) {
      console.log('Auth tables might already exist:', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      result: result.rows 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}