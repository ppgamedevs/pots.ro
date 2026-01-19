import { eq } from 'drizzle-orm';

/**
 * Generate a display ID from email
 * Extracts the username part before @ and adds a number if needed for uniqueness
 * Examples: "john.doe@example.com" -> "johndoe" or "johndoe2" if taken
 */

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
export async function generateUniqueDisplayId(db: any, users: any, email?: string): Promise<string> {
  let displayId: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  // Get base username from email
  const baseUsername = email ? formatEmailUsername(email) : 'user';
  
  try {
    // First, try without any number
    displayId = baseUsername;
    const firstCheck = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayId, displayId))
      .limit(1);
    
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
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.displayId, displayId))
        .limit(1);
      
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
