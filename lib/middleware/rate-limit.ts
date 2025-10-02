/**
 * Rate limiting middleware pentru Pots.ro
 * Implementare simplă cu in-memory fallback și suport pentru Vercel KV
 */

import { NextRequest, NextResponse } from 'next/server';

// Tipuri pentru rate limiting
interface RateLimitConfig {
  windowMs: number; // Perioada în milisecunde
  maxRequests: number; // Numărul maxim de cereri
  keyGenerator?: (req: NextRequest) => string; // Funcție pentru generarea cheii
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store in-memory pentru rate limiting (fallback)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurații pentru diferite endpoint-uri
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 5 * 60 * 1000, // 5 minute
    maxRequests: 10,
    keyGenerator: (req) => `login:${getClientIP(req)}`,
  },
  messages: {
    windowMs: 60 * 1000, // 1 minut
    maxRequests: 30,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `messages:${userId}`;
    },
  },
};

// Helper pentru obținerea IP-ului clientului
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.ip || 'unknown';
}

// Helper pentru cleanup-ul store-ului
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Funcția principală de rate limiting
export async function rateLimit(
  req: NextRequest,
  endpoint: keyof typeof RATE_LIMITS
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[endpoint];
  
  if (!config) {
    return null; // Nu aplică rate limiting pentru endpoint-uri necunoscute
  }

  const key = config.keyGenerator ? config.keyGenerator(req) : `default:${getClientIP(req)}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Cleanup periodic
  if (Math.random() < 0.01) { // 1% șansă de cleanup
    cleanupExpiredEntries();
  }

  // Verifică entry-ul curent
  const currentEntry = rateLimitStore.get(key);
  
  if (!currentEntry || currentEntry.resetTime <= now) {
    // Prima cerere sau window-ul a expirat
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null; // Permite cererea
  }

  // Verifică dacă a depășit limita
  if (currentEntry.count >= config.maxRequests) {
    return NextResponse.json(
      {
        error: 'Prea multe cereri',
        message: `Limita de ${config.maxRequests} cereri în ${config.windowMs / 1000} secunde a fost depășită`,
        retryAfter: Math.ceil((currentEntry.resetTime - now) / 1000),
      },
      { status: 429 }
    );
  }

  // Incrementează contorul
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);

  return null; // Permite cererea
}

// Middleware pentru aplicarea rate limiting-ului
export function withRateLimit(endpoint: keyof typeof RATE_LIMITS) {
  return async function middleware(req: NextRequest) {
    const response = await rateLimit(req, endpoint);
    return response;
  };
}

// Helper pentru verificarea rate limit-ului în API routes
export async function checkRateLimit(
  req: NextRequest,
  endpoint: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const response = await rateLimit(req, endpoint);
  
  if (response) {
    return { allowed: false, response };
  }
  
  return { allowed: true };
}

// Funcție pentru resetarea rate limit-ului (pentru testing)
export function resetRateLimit(key?: string) {
  if (key) {
    rateLimitStore.delete(key);
  } else {
    rateLimitStore.clear();
  }
}

// Funcție pentru obținerea statisticilor rate limiting
export function getRateLimitStats() {
  const stats: Record<string, { count: number; resetTime: number }> = {};
  
  for (const [key, entry] of rateLimitStore.entries()) {
    stats[key] = {
      count: entry.count,
      resetTime: entry.resetTime,
    };
  }
  
  return stats;
}

// Export pentru configurații (pentru debugging)
export { RATE_LIMITS };
