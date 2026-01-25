/**
 * Admin rate limiting utilities
 * 
 * Simple in-memory rate limiter for admin API endpoints.
 * For production, consider using Redis or a dedicated rate limiting service.
 */

// In-memory store for rate limits
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
const cleanupInterval = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) return;
  
  lastCleanup = now;
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for an action
 * 
 * @param key - Unique identifier for the rate limit (e.g., `admin_invoice_regenerate_${userId}`)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @throws Error if rate limit exceeded
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<void> {
  cleanup();
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }
  
  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    const error = new Error(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
    (error as any).statusCode = 429;
    (error as any).retryAfter = retryAfterSeconds;
    throw error;
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
}

/**
 * Get remaining requests for a rate limit key
 */
export function getRateLimitRemaining(
  key: string,
  maxRequests: number
): { remaining: number; resetAt: number | null } {
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < Date.now()) {
    return { remaining: maxRequests, resetAt: null };
  }
  
  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific key
 * Useful for admin operations or testing
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Create a rate limit middleware response
 */
export function rateLimitExceededResponse(error: any) {
  return new Response(
    JSON.stringify({
      error: error.message || 'Rate limit exceeded',
      retryAfter: error.retryAfter || 60,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(error.retryAfter || 60),
      },
    }
  );
}
