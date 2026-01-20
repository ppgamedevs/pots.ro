import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.local" });
dotenvConfig();

async function deleteUser() {
  const DATABASE_URL = 
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_POSTGRES_URL ||
    process.env.POSTGRES_URL;

  if (!DATABASE_URL) {
    console.error("❌ No DATABASE_URL found in environment");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    const userEmail = 'alex.aka.musat@gmail.com';
    
    // Find user
    console.log(`\n🔍 Searching for user: ${userEmail}`);
    const users = await sql`
      SELECT id, email, role, created_at 
      FROM users 
      WHERE email = ${userEmail}
    `;

    if (users.length === 0) {
      console.log(`\n❌ User ${userEmail} not found in database`);
      return;
    }

    const user = users[0];
    console.log(`\n✅ Found user: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.created_at}`);

    const userId = user.id;

    // Count related data
    const ordersCount = await sql`
      SELECT COUNT(*) as count FROM orders WHERE buyer_id = ${userId}
    `;
    console.log(`\n📊 Found ${ordersCount[0].count} orders`);

    const sessionsCount = await sql`
      SELECT COUNT(*) as count FROM sessions WHERE user_id = ${userId}
    `;
    console.log(`   Found ${sessionsCount[0].count} sessions`);

    const gdprCount = await sql`
      SELECT COUNT(*) as count FROM gdpr_preferences WHERE email = ${userEmail}
    `;
    console.log(`   Found ${gdprCount[0].count} GDPR preferences`);

    const authAuditCount = await sql`
      SELECT COUNT(*) as count FROM auth_audit WHERE user_id = ${userId} OR email = ${userEmail}
    `;
    console.log(`   Found ${authAuditCount[0].count} auth audit entries`);

    // Delete orders first (because they have onDelete: "restrict")
    // This will cascade delete: order_items, invoices, conversations, payouts, refunds, audit_logs, webhook_events
    if (ordersCount[0].count > 0) {
      console.log(`\n🗑️  Deleting ${ordersCount[0].count} orders...`);
      await sql`
        DELETE FROM orders WHERE buyer_id = ${userId}
      `;
      console.log(`✅ Deleted orders`);
    }

    // Delete GDPR preferences (by email)
    if (gdprCount[0].count > 0) {
      console.log(`\n🗑️  Deleting GDPR preferences...`);
      await sql`
        DELETE FROM gdpr_preferences WHERE email = ${userEmail}
      `;
      console.log(`✅ Deleted GDPR preferences`);
    }

    // Delete sessions
    if (sessionsCount[0].count > 0) {
      console.log(`\n🗑️  Deleting sessions...`);
      await sql`
        DELETE FROM sessions WHERE user_id = ${userId}
      `;
      console.log(`✅ Deleted sessions`);
    }

    // Delete auth audit entries
    if (authAuditCount[0].count > 0) {
      console.log(`\n🗑️  Deleting auth audit entries...`);
      await sql`
        DELETE FROM auth_audit WHERE user_id = ${userId} OR email = ${userEmail}
      `;
      console.log(`✅ Deleted auth audit entries`);
    }

    // Delete user (this will cascade delete: saved_payment_cards, carts, sellers, etc.)
    console.log(`\n🗑️  Deleting user...`);
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `;
    console.log(`✅ Deleted user ${userEmail}`);

    console.log(`\n🎉 Successfully deleted user and all associated data!`);

  } catch (error) {
    console.error("❌ Error deleting user:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      if (error.stack) {
        console.error("   Stack:", error.stack);
      }
    }
  } finally {
    await sql.end();
    console.log("\n✅ Database connection closed");
  }
}

deleteUser();
