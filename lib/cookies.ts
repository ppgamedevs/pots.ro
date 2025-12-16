import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const CART_SESSION_COOKIE_NAME = "cart_session_id";
export const CART_SESSION_MAX_AGE = 180 * 24 * 60 * 60; // 180 days in seconds

export type CartSessionIdResult = {
  sessionId: string;
  isNew: boolean;
};

export const cartSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: CART_SESSION_MAX_AGE,
  path: "/",
};

/**
 * Read the anonymous cart session cookie. If missing, generate a new session id.
 * IMPORTANT: this does NOT set the cookie on the response (Route Handlers should set it on NextResponse).
 */
export function getOrCreateCartSessionId(): CartSessionIdResult {
  const cookieStore = cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE_NAME)?.value;

  if (existing) return { sessionId: existing, isNew: false };

  // 32 hex chars
  const sessionId = randomBytes(16).toString("hex");
  return { sessionId, isNew: true };
}

export function getSessionId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(CART_SESSION_COOKIE_NAME)?.value || null;
}

// Backwards-compatible export (kept to avoid accidental imports elsewhere).
// Prefer getOrCreateCartSessionId + explicitly setting cookies on the response.
export async function getOrSetSessionId(): Promise<string> {
  return getOrCreateCartSessionId().sessionId;
}
