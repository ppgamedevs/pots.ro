import { cookies } from "next/headers";
import { lucia } from "@/auth/lucia";
import { db } from "@/db";
import { users } from "@/db/schema/core";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return null;
  }

  const result = await lucia.validateSession(sessionId);
  if (!result.session || !result.user) {
    return null;
  }

  return result.user;
}

export async function requireRole(allowedRoles: ('buyer' | 'seller' | 'admin')[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }
  
  return user;
}

export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === 'admin';
}

export function isSeller(user: { role: string } | null): boolean {
  return user?.role === 'seller' || user?.role === 'admin';
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

