/**
 * Rate limiting middleware pentru Pots.ro
 * Implementare simplă cu in-memory fallback și suport pentru Vercel KV
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuthEvent } from '@/lib/auth/session';
import { getClientIP as getClientIPFromHeaders, getUserAgent as getUserAgentFromHeaders } from '@/lib/auth/crypto';
import { getJsonSetting } from '@/lib/settings/store';

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
    keyGenerator: (req) => `login:${getClientIPFromHeaders(req.headers)}`,
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

type AbuseLists = {
  allowedIps: string[];
  blockedIps: string[];
  challengeIps: string[];
};

let abuseListsCache: { value: AbuseLists; fetchedAt: number } | null = null;

async function getAbuseLists(): Promise<AbuseLists> {
  const now = Date.now();
  if (abuseListsCache && now - abuseListsCache.fetchedAt < 30_000) {
    return abuseListsCache.value;
  }

  try {
    const [allowedIps, blockedIps, challengeIps] = await Promise.all([
      getJsonSetting<string[]>('abuse.allowed_ips_json', []),
      getJsonSetting<string[]>('abuse.blocked_ips_json', []),
      getJsonSetting<string[]>('abuse.challenge_ips_json', []),
    ]);

    const value = {
      allowedIps: Array.isArray(allowedIps) ? allowedIps : [],
      blockedIps: Array.isArray(blockedIps) ? blockedIps : [],
      challengeIps: Array.isArray(challengeIps) ? challengeIps : [],
    };
    abuseListsCache = { value, fetchedAt: now };
    return value;
  } catch {
    const value = { allowedIps: [], blockedIps: [], challengeIps: [] };
    abuseListsCache = { value, fetchedAt: now };
    return value;
  }
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

  const ip = getClientIPFromHeaders(req.headers);
  const ua = getUserAgentFromHeaders(req.headers);
  const lists = await getAbuseLists();

  if (lists.allowedIps.includes(ip)) {
    return null;
  }

  if (lists.blockedIps.includes(ip)) {
    await logAuthEvent('rate_limit', undefined, undefined, ip, ua, {
      source: 'middleware_rate_limit',
      endpoint,
      decision: 'blocked_ip',
      path: req.nextUrl?.pathname,
    });
    return NextResponse.json(
      { error: 'Blocked', message: 'Access blocked' },
      { status: 429 }
    );
  }

  const isChallenge = lists.challengeIps.includes(ip);
  const effectiveMax = isChallenge ? Math.max(1, Math.floor(config.maxRequests / 2)) : config.maxRequests;
  const key = config.keyGenerator ? config.keyGenerator(req) : `default:${ip}`;
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
  if (currentEntry.count >= effectiveMax) {
    await logAuthEvent('rate_limit', undefined, undefined, ip, ua, {
      source: 'middleware_rate_limit',
      endpoint,
      key,
      maxRequests: effectiveMax,
      windowMs: config.windowMs,
      retryAfterSeconds: Math.ceil((currentEntry.resetTime - now) / 1000),
      path: req.nextUrl?.pathname,
      challenged: isChallenge,
    });
    return NextResponse.json(
      {
        error: 'Prea multe cereri',
        message: `Limita de ${effectiveMax} cereri în ${config.windowMs / 1000} secunde a fost depășită`,
        retryAfter: Math.ceil((currentEntry.resetTime - now) / 1000),
      },
      { status: 429 }
    );
  }

  // Incrementează contorul
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);

  if (isChallenge) {
    // Minimal “challenge mode”: add small jitter to slow down abuse without a CAPTCHA dependency.
    const jitterMs = 150 + Math.floor(Math.random() * 150);
    await new Promise((r) => setTimeout(r, jitterMs));
  }

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
