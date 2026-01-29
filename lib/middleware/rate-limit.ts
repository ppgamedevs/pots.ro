/**
 * Rate limiting middleware pentru FloristMarket.ro
 * Implementare cu database persistence pentru serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuthEvent } from '@/lib/auth/session';
import { getClientIP as getClientIPFromHeaders, getUserAgent as getUserAgentFromHeaders } from '@/lib/auth/crypto';
import { getJsonSetting } from '@/lib/settings/store';
import { db } from '@/db';
import { rateLimits, users } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';

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
  admin_exports: {
    windowMs: 60 * 1000, // 1 minut
    maxRequests: 5, // 5 exports pe minut per admin
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `admin_exports:${userId}`;
    },
  },

  // Seller onboarding / KYC document uploads
  // Protects the DB (encrypted bytea storage) from abuse.
  seller_kyc_upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 12, // 12 uploads / 10 min / IP
    keyGenerator: (req) => `seller_kyc_upload:${getClientIPFromHeaders(req.headers)}`,
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

// DB-backed rate limit check and increment
async function checkAndIncrementRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; current: number; resetTime: number }> {
  const now = Date.now();
  const resetTime = now + config.windowMs;

  try {
    // Try to get existing entry
    const existing = await db.query.rateLimits.findFirst({
      where: eq(rateLimits.key, key),
    });

    if (!existing || existing.resetAt <= now) {
      // No entry or expired - create/update with count 1
      await db
        .insert(rateLimits)
        .values({ key, count: 1, resetAt: resetTime })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, resetAt: resetTime },
        });
      return { allowed: true, current: 1, resetTime };
    }

    // Entry exists and is valid - check limit
    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        current: existing.count,
        resetTime: existing.resetAt,
      };
    }

    // Increment count
    await db
      .update(rateLimits)
      .set({ count: sql`${rateLimits.count} + 1` })
      .where(eq(rateLimits.key, key));

    return {
      allowed: true,
      current: existing.count + 1,
      resetTime: existing.resetAt,
    };
  } catch (error) {
    console.error('Rate limit DB error:', error);
    // Fail open on DB errors to avoid blocking legitimate traffic
    return { allowed: true, current: 0, resetTime };
  }
}

// Cleanup expired entries periodically
async function cleanupExpiredEntries() {
  try {
    const now = Date.now();
    await db.delete(rateLimits).where(sql`${rateLimits.resetAt} <= ${now}`);
  } catch (error) {
    // Ignore cleanup errors
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

  // Check for allowed IPs
  if (lists.allowedIps.includes(ip)) {
    return null;
  }

  // Check for rate limit bypass via user setting (from session cookie)
  try {
    const { getSession } = await import('@/lib/auth/session');
    const session = await getSession();
    if (session?.user?.id) {
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { rateLimitBypass: true },
      });
      if (userRecord?.rateLimitBypass) {
        return null; // Bypass rate limiting for this user
      }
    }
  } catch {
    // Ignore errors - proceed with normal rate limiting
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

  // Cleanup periodic (1% chance)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries().catch(() => {});
  }

  // Check rate limit via DB
  const result = await checkAndIncrementRateLimit(key, {
    ...config,
    maxRequests: effectiveMax,
  });

  if (!result.allowed) {
    await logAuthEvent('rate_limit', undefined, undefined, ip, ua, {
      source: 'middleware_rate_limit',
      endpoint,
      key,
      maxRequests: effectiveMax,
      windowMs: config.windowMs,
      retryAfterSeconds: Math.ceil((result.resetTime - Date.now()) / 1000),
      path: req.nextUrl?.pathname,
      challenged: isChallenge,
    });
    return NextResponse.json(
      {
        error: 'Prea multe cereri',
        message: `Limita de ${effectiveMax} cereri în ${config.windowMs / 1000} secunde a fost depășită`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    );
  }

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
export async function resetRateLimit(key?: string) {
  try {
    if (key) {
      await db.delete(rateLimits).where(eq(rateLimits.key, key));
    } else {
      await db.delete(rateLimits);
    }
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
  }
}

// Funcție pentru obținerea statisticilor rate limiting
export async function getRateLimitStats() {
  try {
    const allLimits = await db.query.rateLimits.findMany();
    const stats: Record<string, { count: number; resetTime: number }> = {};
    
    for (const entry of allLimits) {
      stats[entry.key] = {
        count: entry.count,
        resetTime: entry.resetAt,
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return {};
  }
}

// Export pentru configurații (pentru debugging)
export { RATE_LIMITS };
