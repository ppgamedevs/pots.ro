/**
 * API Route Wrapper with Performance Monitoring
 * 
 * Wraps API route handlers to automatically track performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { performanceMonitor } from './performance';

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with performance monitoring
 */
export function withPerformanceMonitoring(
  handler: ApiHandler,
  operation?: string
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const start = Date.now();
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    const op = operation || `${method} ${pathname}`;

    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;
      const statusCode = response.status;

      // Log API request performance
      logger.apiRequest(method, pathname, statusCode, duration, {
        component: 'api',
        operation: op,
      });

      // Track in performance monitor
      performanceMonitor.recordMetric({
        operation: op,
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
        operation: op,
        duration,
      });

      performanceMonitor.recordMetric({
        operation: op,
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
  };
}
