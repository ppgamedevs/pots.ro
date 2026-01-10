/**
 * Performance Monitoring Utilities
 * 
 * Tracks and logs performance metrics for API requests, database queries, and operations
 */

import { logger } from './logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Track performance of an async operation
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const duration = Date.now() - start;
      const metric: PerformanceMetric = {
        operation,
        duration,
        success,
        metadata,
      };

      this.recordMetric(metric);
      this.logMetric(metric);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Log metric based on performance thresholds
   */
  private logMetric(metric: PerformanceMetric): void {
    const { operation, duration, success, metadata } = metric;

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        component: 'performance',
        operation,
        duration,
        success,
        ...metadata,
      });
    } else if (duration > 500) {
      logger.info('Operation performance', {
        component: 'performance',
        operation,
        duration,
        success,
        ...metadata,
      });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Operation completed', {
        component: 'performance',
        operation,
        duration,
        success,
        ...metadata,
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
  } {
    const filtered = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        errorRate: 0,
      };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const errors = filtered.filter(m => !m.success).length;

    return {
      count: filtered.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      errorRate: errors / filtered.length,
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function for tracking API requests
export async function trackApiRequest<T>(
  method: string,
  path: string,
  handler: () => Promise<T>
): Promise<T> {
  return performanceMonitor.track(
    `api.${method.toLowerCase()}.${path}`,
    handler,
    { method, path }
  );
}

// Helper function for tracking database queries
export async function trackDbQuery<T>(
  query: string,
  handler: () => Promise<T>
): Promise<T> {
  return performanceMonitor.track(
    'db.query',
    handler,
    { query: query.substring(0, 100) } // Limit query length
  );
}
