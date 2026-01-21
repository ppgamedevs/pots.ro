/**
 * Database connection și configurare Drizzle
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema/core';

// Configurare conexiune PostgreSQL
// Accept multiple provider env var names (Vercel Postgres, local, pooled/unpooled)
const connectionString =
  process.env.POSTGRES_DATABASE_URL ||
  process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_POSTGRES_URL ||
  process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Client PostgreSQL with optimized connection pooling
const client = postgres(connectionString, {
  prepare: false,
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
  max_lifetime: 60 * 30, // Close connections after 30 minutes
  transform: {
    undefined: null, // Transform undefined to null
  },
});

// Drizzle instance
export const db = drizzle(client, { schema });

// Export schema pentru utilizare în alte fișiere
export * from '@/db/schema/core';
