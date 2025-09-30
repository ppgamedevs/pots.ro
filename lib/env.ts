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

// No exports; side-effect module


