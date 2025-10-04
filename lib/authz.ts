import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
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
  
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  };
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
