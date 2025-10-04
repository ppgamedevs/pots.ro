import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/about',
    '/contact',
    '/careers',
    '/press',
    '/privacy',
    '/terms',
    '/cookies',
    '/faq',
    '/returns',
    '/shipping',
    '/help',
    '/gdpr',
    '/blog',
    '/products',
    '/search',
    '/seller',
    '/seller/requirements',
    '/seller/apply',
    '/seller/thanks',
    '/c',
    '/p',
    '/s',
    '/cart',
    '/checkout',
    '/checkout/success',
    '/checkout/fail',
    '/ui-demo',
    '/components-demo',
    '/forms-demo',
    '/demo-form',
    '/admin-demo',
    '/dashboard-demo',
    '/skeleton-demo',
    '/seo'
  ];
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  try {
    const session = await getSession();
    
    if (!session) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role-based route protection
    if (pathname.startsWith('/dashboard/seller')) {
      if (session.user.role !== 'seller' && session.user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin')) {
      if (session.user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Add user info to headers for server components
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email);
    response.headers.set('x-user-role', session.user.role);
    
    return response;
    
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
