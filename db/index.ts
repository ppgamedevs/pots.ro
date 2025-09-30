import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import "../lib/env";
import * as schema from "./schema/core";

// Create the database instance using Vercel Postgres
export const db = drizzle(sql, { schema });

// Export schema for use in other files
export * from "./schema/core";
