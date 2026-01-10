/**
 * Performance Monitoring Middleware
 * 
 * Tracks API request performance and logs metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';

export async function performanceMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const start = Date.now();
  const { method, pathname } = request;
  
  // Skip performance tracking for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon')
  ) {
    return handler(request);
  }

  try {
    const response = await handler(request);
    const duration = Date.now() - start;
    const statusCode = response.status;

    // Log API request performance
    logger.apiRequest(method, pathname, statusCode, duration, {
      component: 'api',
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Track in performance monitor
    performanceMonitor.recordMetric({
      operation: `api.${method.toLowerCase()}.${pathname}`,
      duration,
      success: statusCode < 500,
      metadata: {
        method,
        path: pathname,
        statusCode,
      },
    });

    // Add performance header
    response.headers.set('X-Response-Time', `${duration}ms`);

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
      component: 'api',
      method,
      path: pathname,
      duration,
    });

    performanceMonitor.recordMetric({
      operation: `api.${method.toLowerCase()}.${pathname}`,
      duration,
      success: false,
      metadata: {
        method,
        path: pathname,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}
