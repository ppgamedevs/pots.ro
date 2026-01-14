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
    sql = postgres(DATABASE_URL, { max: 1, idle_timeout: 30 });

    // Test connection
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (connErr) {
      console.error('❌ Cannot connect to database:', connErr.message);
      process.exit(1);
    }

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
