import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "cart_session_id";
const SESSION_MAX_AGE = 180 * 24 * 60 * 60; // 180 days in seconds

export async function getOrSetSessionId(): Promise<string> {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = randomBytes(16).toString("hex");
    
    // Set httpOnly cookie
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }
  
  return sessionId;
}

export function getSessionId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}
