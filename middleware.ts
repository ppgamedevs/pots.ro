import { NextRequest, NextResponse } from 'next/server';
import { verifyMiddlewareSessionToken } from '@/lib/auth/middleware-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle non-existent icon requests immediately to prevent repeated requests
  // These are typically PWA icon requests from browser extensions (32.png, 64.png, 128.png, etc.)
  // Check for exact matches and pattern matches for icon sizes
  const iconPattern = /^\/(16|32|48|64|96|128|144|192|256|384|512)\.png$/;
  if (
    pathname === '/32.png' ||
    pathname === '/64.png' ||
    pathname === '/128.png' ||
    pathname === '/192.png' ||
    pathname === '/512.png' ||
    pathname === '/icon.png' ||
    pathname === '/icon' ||
    iconPattern.test(pathname)
  ) {
    return new NextResponse('', {
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable, must-revalidate, stale-while-revalidate=86400',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
      },
    });
  }
  
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
    '/autentificare',
    '/about',
    '/contact',
    '/cariere',
    '/presa',
    '/confidentialitate',
    '/privacy',
    '/termeni',
    '/cookies',
    '/faq',
    '/returns',
    '/shipping',
    '/help',
    '/ajutor',
    '/ghiduri',
    '/gdpr',
    '/blog',
    '/products',
    '/search',
    '/cautare',
    '/seller',
    '/seller/requirements',
    '/seller/apply',
    '/seller/thanks',
    '/c',
    '/p',
    '/s',
    '/cart',
    '/cos',
    '/checkout',
    '/finalizare',
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
  
  // For protected routes, validate JWT session
  try {
    console.log('[middleware] Validating session for protected route:', pathname);
    const session = await verifyMiddlewareSessionToken(request);
    
    if (!session) {
      console.log('[middleware] No valid session found, redirecting to login');
      // Redirect to login with return URL
      const loginUrl = new URL('/autentificare', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('[middleware] Session valid, continuing to:', pathname);
    // Session is valid, continue
    return NextResponse.next();
  } catch (error) {
    console.error('[middleware] Session validation error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/autentificare', request.url);
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
