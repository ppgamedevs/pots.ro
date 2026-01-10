/**
 * Sentry utility functions for error tracking
 * Use these helpers to capture errors in API routes and server components
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception to Sentry
 * Use this in API routes and server components
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error (not sent to Sentry in development):', error, context);
  }
}

/**
 * Capture a message to Sentry
 * Use this for non-error events that you want to track
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

/**
 * Set user context for Sentry
 * Call this after user authentication to track errors by user
 */
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.email,
      role: user.role,
    });
  }
}

/**
 * Clear user context
 * Call this on logout
 */
export function clearUserContext() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Use this to track user actions leading up to an error
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      data,
      level: 'info',
    });
  }
}

/**
 * Wrap an async function with error tracking
 * Automatically captures errors and re-throws them
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        function: context || fn.name,
        args: args.length > 0 ? JSON.stringify(args) : undefined,
      });
      throw error;
    }
  }) as T;
}
