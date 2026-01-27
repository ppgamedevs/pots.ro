import { config } from "dotenv";
config({ path: ".env.local" });
config();
import "../lib/env";

import { Client } from "pg";

const EMAIL = "alex.aka.musat@gmail.com";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  "";

async function main() {
  if (!dbUrl.trim()) {
    console.error(
      "❌ No DB URL. Set one of DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING in .env.local"
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const res = await client.query(
      `UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = $1 RETURNING id, email, role`,
      [EMAIL]
    );

    if (res.rowCount && res.rowCount > 0 && res.rows[0]) {
      const row = res.rows[0];
      console.log(`✅ Updated ${row.email} to role: ${row.role}`);
    } else {
      console.log(`❌ No user found with email: ${EMAIL}`);
    }
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
