import { config as dotenvConfig } from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenvConfig({ path: ".env.local" });
dotenvConfig();

/**
 * Clean and format email username for display ID
 */
function formatEmailUsername(email: string): string {
  // Extract part before @
  const username = email.split('@')[0];
  
  // Remove special characters, keep only letters and numbers
  const cleaned = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Ensure it's not empty and has reasonable length
  if (!cleaned || cleaned.length < 2) {
    return 'user';
  }
  
  // Limit to 20 characters
  return cleaned.substring(0, 20);
}

/**
 * Generate a unique display ID from email that doesn't exist in the database
 */
async function generateUniqueDisplayId(sql: any, email: string): Promise<string> {
  let displayId: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  // Get base username from email
  const baseUsername = formatEmailUsername(email);
  
  try {
    // First, try without any number
    displayId = baseUsername;
    const firstCheck = await sql`
      SELECT id FROM users WHERE display_id = ${displayId} LIMIT 1
    `;
    
    if (firstCheck.length === 0) {
      return displayId; // Username is available without number
    }
    
    // If taken, try with numbers
    do {
      attempts++;
      displayId = `${baseUsername}${attempts}`;
      
      if (attempts > maxAttempts) {
        // Fallback to timestamp-based ID if we can't generate a unique one
        displayId = `user${Date.now()}`;
        break;
      }
      
      // Check if displayId already exists
      const existing = await sql`
        SELECT id FROM users WHERE display_id = ${displayId} LIMIT 1
      `;
      
      if (existing.length === 0) {
        break; // Found unique ID
      }
    } while (true);
  } catch (error) {
    console.error('Error generating unique display ID:', error);
    // Fallback to timestamp-based ID if database query fails
    displayId = `${baseUsername}${Date.now()}`;
  }
  
  return displayId;
}

async function createAdminUser() {
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
    
    // Check if user already exists
    console.log(`\n🔍 Checking for user: ${userEmail}`);
    const existingUsers = await sql`
      SELECT id, email, role, display_id 
      FROM users 
      WHERE email = ${userEmail}
    `;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log(`\n✅ User already exists: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Current role: ${existingUser.role}`);
      console.log(`   Display ID: ${existingUser.display_id}`);
      
      if (existingUser.role === 'admin') {
        console.log(`\n✅ User already has admin role!`);
        return;
      } else {
        // Update role to admin
        console.log(`\n🔄 Updating user role to admin...`);
        const updated = await sql`
          UPDATE users 
          SET role = 'admin', updated_at = NOW()
          WHERE email = ${userEmail}
          RETURNING id, email, role, display_id
        `;
        
        console.log(`\n✅ Successfully updated user role to admin!`);
        console.log(`   Email: ${updated[0].email}`);
        console.log(`   New role: ${updated[0].role}`);
        console.log(`   Display ID: ${updated[0].display_id}`);
        console.log(`\n🎉 User ${userEmail} is now an administrator!`);
        return;
      }
    }

    // User doesn't exist, create new user with admin role
    console.log(`\n📝 Creating new user with admin role...`);
    
    // Generate unique display ID
    const displayId = await generateUniqueDisplayId(sql, userEmail);
    console.log(`   Generated display ID: ${displayId}`);
    
    // Create user with admin role
    const newUser = await sql`
      INSERT INTO users (email, display_id, role, name, created_at, updated_at)
      VALUES (${userEmail}, ${displayId}, 'admin', NULL, NOW(), NOW())
      RETURNING id, email, role, display_id, created_at
    `;
    
    console.log(`\n✅ Successfully created user with admin role!`);
    console.log(`   ID: ${newUser[0].id}`);
    console.log(`   Email: ${newUser[0].email}`);
    console.log(`   Role: ${newUser[0].role}`);
    console.log(`   Display ID: ${newUser[0].display_id}`);
    console.log(`   Created: ${newUser[0].created_at}`);
    console.log(`\n🎉 User ${userEmail} has been created as an administrator!`);

  } catch (error) {
    console.error("❌ Error creating/updating admin user:", error);
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

createAdminUser();
