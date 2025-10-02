/**
 * Database connection și configurare Drizzle
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema/core';

// Configurare conexiune PostgreSQL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Client PostgreSQL
const client = postgres(connectionString, {
  prepare: false,
});

// Drizzle instance
export const db = drizzle(client, { schema });

// Export schema pentru utilizare în alte fișiere
export * from '@/db/schema/core';
