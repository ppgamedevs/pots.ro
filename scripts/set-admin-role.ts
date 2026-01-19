import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.local" });
dotenvConfig();

async function setAdminRole() {
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
    const adminEmail = 'eccostachescu@gmail.com';
    
    // Check if user exists
    const user = await sql`
      SELECT id, email, role 
      FROM users 
      WHERE email = ${adminEmail}
    `;

    if (user.length === 0) {
      console.log(`\n❌ User ${adminEmail} not found in database`);
      console.log("User will be created as admin on next login.");
    } else {
      console.log(`\n✅ Found user: ${user[0].email}`);
      console.log(`   Current role: ${user[0].role}`);
      
      if (user[0].role === 'admin') {
        console.log("\n✅ User already has admin role!");
      } else {
        // Update role to admin
        const updated = await sql`
          UPDATE users 
          SET role = 'admin', updated_at = NOW()
          WHERE email = ${adminEmail}
          RETURNING id, email, role
        `;
        
        console.log(`\n✅ Successfully updated user role to admin!`);
        console.log(`   Email: ${updated[0].email}`);
        console.log(`   New role: ${updated[0].role}`);
        console.log("\n🎉 User ${adminEmail} is now an administrator!");
      }
    }

  } catch (error) {
    console.error("❌ Error updating user role:", error);
  } finally {
    await sql.end();
    console.log("\n✅ Database connection closed");
  }
}

setAdminRole();
