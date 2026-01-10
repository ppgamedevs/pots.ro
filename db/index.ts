import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import "../lib/env";
import * as schema from "./schema/core";

// Mock database implementation for development
class MockDatabase {
  private data: Map<string, any[]> = new Map();
  
  async execute(query: string, params: any[] = []) {
    console.log('🔧 Mock DB Query:', query.substring(0, 100) + '...');
    
    // Handle common queries
    if (query.includes('SELECT 1 as test')) {
      return { rows: [{ test: 1 }] };
    }
    
    if (query.includes('CREATE TABLE IF NOT EXISTS')) {
      return { rows: [] };
    }
    
    if (query.includes('CREATE INDEX IF NOT EXISTS')) {
      return { rows: [] };
    }
    
    if (query.includes('ALTER TABLE')) {
      return { rows: [] };
    }
    
    if (query.includes('INSERT INTO users')) {
      const mockUser = {
        id: 'mock-user-id-' + Date.now(),
        email: params[0] || 'test@example.com',
        displayId: params[1] || 'mockuser123',
        role: params[2] || 'buyer',
        name: params[3] || null,
        created_at: new Date().toISOString()
      };
      return { rows: [mockUser] };
    }
    
    if (query.includes('SELECT') && query.includes('FROM users')) {
      return { rows: [] }; // No existing users in mock
    }
    
    if (query.includes('SELECT') && query.includes('FROM auth_otp')) {
      return { rows: [] }; // No existing OTP records in mock
    }
    
    if (query.includes('UPDATE auth_otp')) {
      return { rows: [] };
    }
    
    if (query.includes('INSERT INTO sessions')) {
      const mockSession = {
        id: 'mock-session-id-' + Date.now(),
        user_id: params[0] || 'mock-user-id',
        session_token_hash: params[1] || 'mock-token-hash',
        expires_at: params[2] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip: params[3] || '127.0.0.1',
        ua: params[4] || 'mock-user-agent',
        created_at: new Date().toISOString()
      };
      return { rows: [mockSession] };
    }
    
    if (query.includes('SELECT') && query.includes('FROM sessions')) {
      return { rows: [] }; // No existing sessions in mock
    }
    
    if (query.includes('INSERT INTO auth_audit')) {
      return { rows: [] };
    }
    
    // Default response
    return { rows: [] };
  }
  
  select() {
    return {
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([])
          }),
          limit: () => Promise.resolve([])
        }),
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve([])
          })
        })
      })
    };
  }
  
  insert() {
    return {
      values: () => ({
        returning: () => Promise.resolve([])
      })
    };
  }
  
  update() {
    return {
      set: () => ({
        where: () => Promise.resolve([])
      })
    };
  }
}

// Check if we have a valid database URL
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

let db: any;

if (!hasDatabaseUrl) {
  // Fallback to console to avoid circular dependency with logger
  console.warn('⚠️  No DATABASE_URL found. Running in mock mode for development.');
  console.warn('   To set up a database, create a .env.local file with:');
  console.warn('   DATABASE_URL=postgresql://username:password@host:port/database');
  console.warn('   Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/pots_ro_dev');
  db = new MockDatabase();
} else {
  // Create the database instance using Vercel Postgres
  db = drizzle(sql, { schema });
}

export { db };

// Export schema for use in other files
export * from "./schema/core";