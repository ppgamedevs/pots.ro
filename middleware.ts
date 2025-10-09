import { NextRequest, NextResponse } from 'next/server';

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
    '/seo',
    '/sol',
    '/reduceri'
  ];
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check session cookie
  const sessionCookie = request.cookies.get('fm_session');
  
  if (!sessionCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For now, just pass through - detailed auth check will be done in API routes
  return NextResponse.next();
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
