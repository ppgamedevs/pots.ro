import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { users } from "@/db/schema/core";
import { eq } from "drizzle-orm";

export type UserRole = 'buyer' | 'seller' | 'admin' | 'support';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  permissions?: string[];
  rateLimitBypass?: boolean;
}

/**
 * Get the authenticated user from the request
 * Returns null if not authenticated
 */
export async function getUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  // Fetch permissions from DB
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        permissions: true,
        rateLimitBypass: true,
      },
    });

    return {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      permissions: (user?.permissions as string[]) || [],
      rateLimitBypass: user?.rateLimitBypass || false,
    };
  } catch (error) {
    // Fallback if DB query fails
    return {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      permissions: [],
      rateLimitBypass: false,
    };
  }
}

/**
 * Require the user to have one of the specified roles
 * Throws 403 if not authenticated or role not allowed
 */
export async function requireRole(
  req: NextRequest, 
  roles: UserRole[]
): Promise<AuthenticatedUser> {
  const user = await getUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasRole(
  req: NextRequest, 
  roles: UserRole[]
): Promise<boolean> {
  try {
    await requireRole(req, roles);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user owns a resource (by comparing user ID with resource owner ID)
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check if user can access order (buyer, seller, or admin)
 */
export async function canAccessOrder(
  req: NextRequest,
  orderBuyerId: string,
  orderSellerId: string
): Promise<AuthenticatedUser> {
  const user = await getUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Admin can access any order
  if (user.role === 'admin') {
    return user;
  }
  
  // Buyer can access their own orders
  if (user.role === 'buyer' && isOwner(user.id, orderBuyerId)) {
    return user;
  }
  
  // Seller can access orders for their products
  if (user.role === 'seller' && isOwner(user.id, orderSellerId)) {
    return user;
  }
  
  throw new Error('Forbidden');
}

/**
 * Check if user has a specific permission
 * Permissions are strings like 'manage_users', 'view_finance', 'approve_payouts'
 */
export async function hasPermission(
  req: NextRequest,
  permission: string
): Promise<boolean> {
  const user = await getUser(req);
  
  if (!user) {
    return false;
  }
  
  // Admins always have all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // Check specific permission
  return user.permissions?.includes(permission) || false;
}

/**
 * Require user to have a specific permission
 */
export async function requirePermission(
  req: NextRequest,
  permission: string
): Promise<AuthenticatedUser> {
  const user = await getUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Admins always have all permissions
  if (user.role === 'admin') {
    return user;
  }
  
  if (!user.permissions?.includes(permission)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

/**
 * Require user to have any of the specified permissions
 */
export async function requireAnyPermission(
  req: NextRequest,
  permissions: string[]
): Promise<AuthenticatedUser> {
  const user = await getUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Admins always have all permissions
  if (user.role === 'admin') {
    return user;
  }
  
  const hasAny = permissions.some(p => user.permissions?.includes(p));
  
  if (!hasAny) {
    throw new Error('Forbidden');
  }
  
  return user;
}
