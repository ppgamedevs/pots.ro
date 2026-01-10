// Normalizes env var names between local .env and Vercel dashboard
// @vercel/postgres expects POSTGRES_URL or POSTGRES_URL_NON_POOLING
// User provided: POSTGRES_POSTGRES_URL, POSTGRES_POSTGRES_URL_NON_POOLING

function setIfMissing(target: string, value?: string) {
  if (value && !process.env[target]) {
    process.env[target] = value;
  }
}

// Map provided variables to the ones libraries expect
setIfMissing("POSTGRES_URL", process.env.POSTGRES_POSTGRES_URL);
setIfMissing("POSTGRES_URL_NON_POOLING", process.env.POSTGRES_POSTGRES_URL_NON_POOLING);

// Drizzle CLI uses DATABASE_URL; prefer non-pooling if available
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_POSTGRES_URL_NON_POOLING || process.env.POSTGRES_POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
}

// Week 4 MVP: Commission and Payment Configuration
export const COMMISSION_PCT = parseInt(process.env.COMMISSION_PCT || '1000', 10); // Default 10% (1000 basis points)
export const NETOPIA_MERCHANT_ID = process.env.NETOPIA_MERCHANT_ID || '';
export const NETOPIA_PRIVATE_KEY = process.env.NETOPIA_PRIVATE_KEY || '';
export const NETOPIA_PUBLIC_CERT = process.env.NETOPIA_PUBLIC_CERT || '';
export const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Validate required environment variables
// Note: Using console.warn here to avoid circular dependency with logger
if (!NETOPIA_MERCHANT_ID && process.env.NODE_ENV === 'production') {
  console.warn('[ENV] NETOPIA_MERCHANT_ID is not set');
}

if (!NETOPIA_PRIVATE_KEY && process.env.NODE_ENV === 'production') {
  console.warn('[ENV] NETOPIA_PRIVATE_KEY is not set');
}


