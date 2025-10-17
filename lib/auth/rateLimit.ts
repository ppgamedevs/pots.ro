import { NextRequest } from 'next/server';
import { db } from '@/db';
import { authOtp, authAudit } from '@/db/schema/core';
import { eq, and, gt, desc } from 'drizzle-orm';
import { getClientIP, getUserAgent, getEmailRateLimitKey, getIPRateLimitKey, getOtpAttemptsKey } from './crypto';
import { logAuthEvent } from './session';

// Rate limit configuration
const RATE_LIMITS = {
  OTP_REQUEST: {
    EMAIL_PER_HOUR: 20,       // 20 requests per hour (increased from 5)
    IP_PER_HOUR: 50,          // 50 requests per hour (increased from 10)
    COOLDOWN_SECONDS: 30,     // 30 seconds cooldown (reduced from 60)
  },
  OTP_VERIFY: {
    MAX_ATTEMPTS: 10,         // 10 verification attempts (increased from 5)
  },
} as const;

// In-memory store for rate limiting (fallback when KV is not available)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if request is rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  type: 'otp_request' | 'otp_verify',
  identifier: string
): Promise<{ allowed: boolean; resetTime?: number; reason?: string }> {
  const ip = getClientIP(request.headers);
  const userAgent = getUserAgent(request.headers);
  const now = Date.now();
  
  if (type === 'otp_request') {
    return await checkOtpRequestRateLimit(identifier, ip, now);
  } else if (type === 'otp_verify') {
    return await checkOtpVerifyRateLimit(identifier, now);
  }
  
  return { allowed: true };
}

/**
 * Check OTP request rate limits
 */
async function checkOtpRequestRateLimit(
  email: string,
  ip: string,
  now: number
): Promise<{ allowed: boolean; resetTime?: number; reason?: string }> {
  const hourAgo = new Date(now - 60 * 60 * 1000);
  
  // Check email rate limit
  const emailKey = getEmailRateLimitKey(email);
  const emailCount = await db
    .select({ count: authOtp.id })
    .from(authOtp)
    .where(
      and(
        eq(authOtp.email, email),
        gt(authOtp.createdAt, hourAgo)
      )
    );
  
  if (emailCount.length >= RATE_LIMITS.OTP_REQUEST.EMAIL_PER_HOUR) {
    await logAuthEvent('rate_limit', email, undefined, ip, undefined, {
      type: 'email_per_hour',
      count: emailCount.length,
      limit: RATE_LIMITS.OTP_REQUEST.EMAIL_PER_HOUR,
    });
    
    return {
      allowed: false,
      resetTime: hourAgo.getTime() + 60 * 60 * 1000,
      reason: 'Too many OTP requests for this email',
    };
  }
  
  // Check IP rate limit
  const ipCount = await db
    .select({ count: authOtp.id })
    .from(authOtp)
    .where(
      and(
        eq(authOtp.ip, ip),
        gt(authOtp.createdAt, hourAgo)
      )
    );
  
  if (ipCount.length >= RATE_LIMITS.OTP_REQUEST.IP_PER_HOUR) {
    await logAuthEvent('rate_limit', undefined, undefined, ip, undefined, {
      type: 'ip_per_hour',
      count: ipCount.length,
      limit: RATE_LIMITS.OTP_REQUEST.IP_PER_HOUR,
    });
    
    return {
      allowed: false,
      resetTime: hourAgo.getTime() + 60 * 60 * 1000,
      reason: 'Too many OTP requests from this IP',
    };
  }
  
  // Check cooldown for same email
  const lastRequest = await db
    .select({ createdAt: authOtp.createdAt })
    .from(authOtp)
    .where(eq(authOtp.email, email))
    .orderBy(desc(authOtp.createdAt))
    .limit(1);
  
  if (lastRequest.length > 0) {
    const lastRequestTime = lastRequest[0].createdAt.getTime();
    const cooldownMs = RATE_LIMITS.OTP_REQUEST.COOLDOWN_SECONDS * 1000;
    
    if (now - lastRequestTime < cooldownMs) {
      const remainingCooldown = cooldownMs - (now - lastRequestTime);
      
      await logAuthEvent('rate_limit', email, undefined, ip, undefined, {
        type: 'cooldown',
        remainingSeconds: Math.ceil(remainingCooldown / 1000),
      });
      
      return {
        allowed: false,
        resetTime: lastRequestTime + cooldownMs,
        reason: 'Please wait before requesting another code',
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Check OTP verify rate limits
 */
async function checkOtpVerifyRateLimit(
  email: string,
  now: number
): Promise<{ allowed: boolean; resetTime?: number; reason?: string }> {
  // Get the latest OTP record for this email
  const latestOtp = await db
    .select({ attempts: authOtp.attempts, createdAt: authOtp.createdAt })
    .from(authOtp)
    .where(eq(authOtp.email, email))
    .orderBy(desc(authOtp.createdAt))
    .limit(1);
  
  if (latestOtp.length === 0) {
    return { allowed: true };
  }
  
  const { attempts, createdAt } = latestOtp[0];
  
  if (attempts >= RATE_LIMITS.OTP_VERIFY.MAX_ATTEMPTS) {
    await logAuthEvent('rate_limit', email, undefined, undefined, undefined, {
      type: 'otp_verify_attempts',
      attempts,
      limit: RATE_LIMITS.OTP_VERIFY.MAX_ATTEMPTS,
    });
    
    return {
      allowed: false,
      reason: 'Too many verification attempts',
    };
  }
  
  return { allowed: true };
}

/**
 * Increment OTP verification attempts
 */
export async function incrementOtpAttempts(email: string): Promise<void> {
  try {
    // Get the latest OTP record
    const latestOtp = await db
      .select({ id: authOtp.id, attempts: authOtp.attempts })
      .from(authOtp)
      .where(eq(authOtp.email, email))
      .orderBy(desc(authOtp.createdAt))
      .limit(1);
    
    if (latestOtp.length > 0) {
      await db
        .update(authOtp)
        .set({ attempts: latestOtp[0].attempts + 1 })
        .where(eq(authOtp.id, latestOtp[0].id));
    }
  } catch (error) {
    console.error('Error incrementing OTP attempts:', error);
  }
}

/**
 * Simple in-memory rate limiter for API endpoints
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
) {
  return (key: string): { allowed: boolean; resetTime?: number } => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true };
    }
    
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
      };
    }
    
    entry.count++;
    return { allowed: true };
  };
}

/**
 * Rate limiter for general API endpoints
 */
export const apiRateLimiter = createRateLimiter(100, 60 * 1000); // 100 requests per minute

/**
 * Rate limiter for auth endpoints
 */
export const authRateLimiter = createRateLimiter(20, 60 * 1000); // 20 requests per minute

/**
 * Check if IP is blocked (for future implementation)
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  // This could be implemented with a blocked IPs table
  // For now, return false
  return false;
}

/**
 * Check if email domain is disposable
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain || '');
}
