/**
 * Suppress url.parse() deprecation warnings from dependencies
 * 
 * This warning (DEP0169) comes from older dependencies like aws-sdk v2
 * that use the deprecated url.parse() method. It's safe to suppress as:
 * 1. It doesn't affect functionality
 * 2. The warning is from dependencies, not our code
 * 3. We can't fix it without updating dependencies
 * 
 * Import this file early in the application lifecycle (e.g., in middleware.ts)
 * 
 * NOTE: For Vercel, you can also set environment variable:
 * NODE_OPTIONS=--no-warnings
 * But this suppresses ALL warnings. This module is more selective.
 */

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Suppress only DEP0169 warnings (url.parse deprecation)
  const originalEmitWarning = process.emitWarning;
  
  process.emitWarning = function(warning: any, ...args: any[]) {
    if (
      typeof warning === 'string' && 
      warning.includes('url.parse()') &&
      warning.includes('DEP0169')
    ) {
      // Suppress this specific deprecation warning
      return;
    }
    // Pass through all other warnings
    return originalEmitWarning.call(this, warning, ...args);
  };

  // Also handle process.on('warning') events
  // Remove existing listeners to avoid duplicates
  process.removeAllListeners('warning');
  
  process.on('warning', (warning) => {
    if (
      warning.name === 'DeprecationWarning' &&
      warning.message.includes('url.parse()') &&
      warning.message.includes('DEP0169')
    ) {
      // Suppress this specific warning
      return;
    }
    // Log other warnings normally
    console.warn(warning.name, warning.message);
  });
}
