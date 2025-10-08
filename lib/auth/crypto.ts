import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Configuration
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_COST = process.env.NODE_ENV === 'production' ? 16384 : 8192; // Lower cost for development

/**
 * Hash a value using scrypt
 * Note: This function uses Node.js crypto module and is not compatible with Edge Runtime
 * Use Web Crypto API for Edge Runtime compatibility
 */
export async function hash(value: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = (await scryptAsync(value, salt, KEY_LENGTH)) as Buffer;
  
  // Combine salt + key and encode as base64
  const combined = Buffer.concat([salt, key]);
  return combined.toString('base64');
}

/**
 * Verify a value against a hash
 * Note: This function uses Node.js crypto module and is not compatible with Edge Runtime
 */
export async function verify(value: string, hash: string): Promise<boolean> {
  try {
    const combined = Buffer.from(hash, 'base64');
    const salt = combined.subarray(0, SALT_LENGTH);
    const storedKey = combined.subarray(SALT_LENGTH);
    
    const key = (await scryptAsync(value, salt, KEY_LENGTH)) as Buffer;
    
    return timingSafeEqual(key, storedKey);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a random token of specified bytes
 */
export function randomToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Generate a random OTP code (6 digits)
 */
export function randomOtp(): string {
  const code = Math.floor(Math.random() * 1000000);
  return code.toString().padStart(6, '0');
}

/**
 * Generate a magic token for email links
 */
export function generateMagicToken(): string {
  return randomToken(32);
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return randomToken(32);
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  // Check various headers for IP
  const xForwardedFor = headers.get('x-forwarded-for');
  const xRealIP = headers.get('x-real-ip');
  const cfConnectingIP = headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Extract User Agent from request headers
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}

/**
 * Generate a rate limit key for email
 */
export function getEmailRateLimitKey(email: string): string {
  return `rate_limit:email:${normalizeEmail(email)}`;
}

/**
 * Generate a rate limit key for IP
 */
export function getIPRateLimitKey(ip: string): string {
  return `rate_limit:ip:${ip}`;
}

/**
 * Generate a rate limit key for OTP attempts
 */
export function getOtpAttemptsKey(email: string): string {
  return `otp_attempts:${normalizeEmail(email)}`;
}
