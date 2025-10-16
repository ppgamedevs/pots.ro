import { eq } from 'drizzle-orm';

/**
 * Generate a unique display ID for users
 * Format: [adjective][noun][number]
 * Examples: "happycat123", "bravewolf456", "cleverfox789"
 */

const adjectives = [
  'happy', 'brave', 'clever', 'bright', 'swift', 'gentle', 'bold', 'wise',
  'calm', 'lively', 'kind', 'strong', 'quick', 'sharp', 'smooth', 'wild',
  'quiet', 'loud', 'soft', 'hard', 'warm', 'cool', 'fresh', 'sweet',
  'bitter', 'sour', 'salty', 'spicy', 'mild', 'hot', 'cold', 'dry',
  'wet', 'damp', 'moist', 'rough', 'fine', 'coarse', 'thick', 'thin',
  'wide', 'narrow', 'deep', 'shallow', 'high', 'low', 'long', 'short',
  'big', 'small', 'huge', 'tiny', 'massive', 'mini', 'giant', 'micro'
];

const nouns = [
  'cat', 'dog', 'fox', 'wolf', 'bear', 'lion', 'tiger', 'eagle', 'hawk',
  'owl', 'raven', 'crow', 'swan', 'duck', 'goose', 'fish', 'shark',
  'whale', 'dolphin', 'seal', 'otter', 'beaver', 'rabbit', 'mouse',
  'hamster', 'squirrel', 'chipmunk', 'deer', 'elk', 'moose', 'horse',
  'cow', 'sheep', 'goat', 'pig', 'chicken', 'rooster', 'turkey',
  'elephant', 'giraffe', 'zebra', 'rhino', 'hippo', 'panda', 'koala',
  'kangaroo', 'monkey', 'ape', 'gorilla', 'sloth', 'armadillo', 'hedgehog',
  'porcupine', 'skunk', 'raccoon', 'possum', 'bat', 'snake', 'lizard',
  'frog', 'toad', 'turtle', 'tortoise', 'crab', 'lobster', 'shrimp',
  'octopus', 'squid', 'jellyfish', 'starfish', 'seahorse', 'penguin',
  'flamingo', 'peacock', 'parrot', 'canary', 'finch', 'sparrow', 'robin',
  'bluebird', 'cardinal', 'hummingbird', 'woodpecker', 'kingfisher'
];

/**
 * Generate a random display ID
 */
export function generateDisplayId(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000) + 1;
  
  return `${adjective}${noun}${number}`;
}

/**
 * Generate a unique display ID that doesn't exist in the database
 */
export async function generateUniqueDisplayId(db: any, users: any): Promise<string> {
  let displayId: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    displayId = generateDisplayId();
    attempts++;
    
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
  
  return displayId;
}
