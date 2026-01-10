/**
 * Structured Logging Utility
 * 
 * Provides structured JSON logging with log levels, context, and production-safe output.
 * Integrates with Vercel Logs and can be extended for other log aggregation services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
  service: string;
}

class Logger {
  private service: string;
  private environment: string;
  private minLevel: LogLevel;

  constructor(service: string = 'pots.ro') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
    
    // Set minimum log level based on environment
    // In production, only log info and above
    // In development, log everything
    this.minLevel = this.environment === 'production' ? 'info' : 'debug';
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= minIndex;
  }

  /**
   * Format log entry as JSON for structured logging
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.environment,
      service: this.service,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Output log entry
   */
  private output(level: LogLevel, entry: LogEntry): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // In production, output as JSON for log aggregation
    // In development, output as pretty formatted string
    if (this.environment === 'production') {
      // JSON output for log aggregation services (Vercel Logs, Datadog, etc.)
      console.log(JSON.stringify(entry));
    } else {
      // Pretty formatted output for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      const color = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }[level];

      const reset = '\x1b[0m';
      const levelUpper = level.toUpperCase().padEnd(5);

      console.log(
        `${color}${emoji} [${levelUpper}]${reset} ${entry.message}`,
        entry.context ? entry.context : '',
        entry.error ? `\n${color}Error: ${entry.error.name}: ${entry.error.message}${reset}` : ''
      );

      if (entry.error?.stack && this.environment === 'development') {
        console.log(`${color}${entry.error.stack}${reset}`);
      }
    }
  }

  /**
   * Debug level logging
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    const entry = this.formatLog('debug', message, context);
    this.output('debug', entry);
  }

  /**
   * Info level logging
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    const entry = this.formatLog('info', message, context);
    this.output('info', entry);
  }

  /**
   * Warn level logging
   * Use for warning messages that don't stop execution
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.formatLog('warn', message, context);
    this.output('warn', entry);
  }

  /**
   * Error level logging
   * Use for error messages and exceptions
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.formatLog('error', message, context, error);
    this.output('error', entry);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode}`, {
      ...context,
      type: 'api_request',
      method,
      path,
      statusCode,
      duration,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration: number, context?: LogContext): void {
    const level: LogLevel = duration > 1000 ? 'warn' : 'debug';
    this.log(level, `DB Query: ${query.substring(0, 100)}...`, {
      ...context,
      type: 'db_query',
      query: query.substring(0, 500), // Limit query length
      duration,
    });
  }

  /**
   * Generic log method
   */
  log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatLog(level, message, context, error);
    this.output(level, entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.service);
    const originalOutput = childLogger.output.bind(childLogger);
    
    // Override output to merge context
    childLogger.output = (level: LogLevel, entry: LogEntry) => {
      if (entry.context) {
        entry.context = { ...context, ...entry.context };
      } else {
        entry.context = context;
      }
      originalOutput(level, entry);
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom loggers
export { Logger };
