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