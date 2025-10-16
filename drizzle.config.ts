import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "drizzle-kit";
// Load env from .env.local first, then fallback to .env
dotenvConfig({ path: ".env.local" });
dotenvConfig();
// Normalize custom env names -> expected
import "./lib/env";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      "",
  },
});
