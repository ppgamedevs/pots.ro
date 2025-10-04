import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuth, requireRole } from '@/lib/auth/session';

/**
 * Middleware for authentication
 */
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  const publicRoutes = [
    '/',
    '/login',
    '/api/auth/otp/request',
    '/api/auth/otp/verify',
    '/api/auth/magic',
    '/api/auth/logout',
    '/api/auth/me',
  ];
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      // Redirect to login for protected routes
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Redirect to login on error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Middleware for role-based access control
 */
export async function roleMiddleware(
  request: NextRequest,
  requiredRole: 'buyer' | 'seller' | 'admin'
) {
  try {
    const user = await requireRole(requiredRole);
    
    // Add user to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    console.error('Role middleware error:', error);
    
    return NextResponse.json(
      { error: `Access denied. ${requiredRole} role required.` },
      { status: 403 }
    );
  }
}

/**
 * API route wrapper for authentication
 */
export function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAuth();
      return handler(request, user);
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * API route wrapper for role-based access
 */
export function withRole(
  requiredRole: 'buyer' | 'seller' | 'admin',
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireRole(requiredRole);
      return handler(request, user);
    } catch (error) {
      return NextResponse.json(
        { error: `${requiredRole} role required` },
        { status: 403 }
      );
    }
  };
}

/**
 * Get user from request headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role');
  
  if (!userId || !userEmail || !userRole) {
    return null;
  }
  
  return {
    id: userId,
    email: userEmail,
    role: userRole as 'buyer' | 'seller' | 'admin',
  };
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: 'buyer' | 'seller' | 'admin',
  requiredRole: 'buyer' | 'seller' | 'admin'
): boolean {
  const roleHierarchy = {
    buyer: 1,
    seller: 2,
    admin: 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Route protection patterns
 */
export const ROUTE_PROTECTION = {
  // Public routes (no auth required)
  public: [
    '/',
    '/login',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/cookies',
  ],
  
  // Buyer routes (buyer, seller, admin)
  buyer: [
    '/profile',
    '/dashboard',
    '/cart',
    '/checkout',
    '/orders',
    '/favorites',
  ],
  
  // Seller routes (seller, admin)
  seller: [
    '/seller',
    '/seller/products',
    '/seller/orders',
    '/seller/analytics',
    '/seller/promotions',
  ],
  
  // Admin routes (admin only)
  admin: [
    '/admin',
    '/admin/users',
    '/admin/products',
    '/admin/orders',
    '/admin/analytics',
  ],
} as const;

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const allProtectedRoutes = [
    ...ROUTE_PROTECTION.buyer,
    ...ROUTE_PROTECTION.seller,
    ...ROUTE_PROTECTION.admin,
  ];
  
  return allProtectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get required role for route
 */
export function getRequiredRole(pathname: string): 'buyer' | 'seller' | 'admin' | null {
  if (ROUTE_PROTECTION.admin.some(route => pathname.startsWith(route))) {
    return 'admin';
  }
  
  if (ROUTE_PROTECTION.seller.some(route => pathname.startsWith(route))) {
    return 'seller';
  }
  
  if (ROUTE_PROTECTION.buyer.some(route => pathname.startsWith(route))) {
    return 'buyer';
  }
  
  return null;
}
