import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.local" });
dotenvConfig();

async function checkAdminUsers() {
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
    // Check for admin users
    const adminUsers = await sql`
      SELECT id, email, role, created_at 
      FROM users 
      WHERE role = 'admin'
    `;

    console.log("\n📊 Admin Users Found:", adminUsers.length);
    
    if (adminUsers.length > 0) {
      console.log("\n👥 Admin users:");
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id}, Created: ${user.created_at})`);
      });
    } else {
      console.log("\n✅ No admin users found in database");
    }

    // Check for eccostachescu@gmail.com
    const targetUser = await sql`
      SELECT id, email, role, created_at 
      FROM users 
      WHERE email = 'eccostachescu@gmail.com'
    `;

    if (targetUser.length > 0) {
      console.log(`\n📧 User eccostachescu@gmail.com exists with role: ${targetUser[0].role}`);
    } else {
      console.log("\n📧 User eccostachescu@gmail.com does not exist yet");
    }

  } catch (error) {
    console.error("❌ Error checking admin users:", error);
  } finally {
    await sql.end();
    console.log("\n✅ Database connection closed");
  }
}

checkAdminUsers();
