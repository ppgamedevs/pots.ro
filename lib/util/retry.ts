/**
 * Retry utility cu exponential backoff pentru Pots.ro
 * Implementează retry logic cu backoff 1s/2s/4s pentru apeluri către provideri externi
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000, // 1s
  maxDelayMs: 4000,  // 4s
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Retry pe 5xx errors sau network errors
    if (error?.status >= 500) return true;
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
    if (error?.message?.includes('timeout')) return true;
    return false;
  }
};

/**
 * Execută o funcție cu retry logic și exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      
      // Dacă este ultima încercare sau nu trebuie să retry, aruncă eroarea
      if (attempt === opts.maxAttempts || !opts.retryCondition(error)) {
        return {
          success: false,
          error,
          attempts: attempt
        };
      }
      
      // Calculează delay-ul cu exponential backoff
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );
      
      console.log(`Încercarea ${attempt} eșuată, retry în ${delay}ms:`, error instanceof Error ? error.message : String(error));
      
      // Așteaptă înainte de următoarea încercare
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: opts.maxAttempts
  };
}

/**
 * Helper pentru retry cu logging specific pentru Pots.ro
 */
export async function retryWithLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(fn, options);
  
  if (result.success) {
    if (result.attempts > 1) {
      console.log(`✅ ${operation} reușit după ${result.attempts} încercări`);
    }
    return result.data!;
  } else {
    console.error(`❌ ${operation} eșuat după ${result.attempts} încercări:`, result.error);
    throw result.error;
  }
}

/**
 * Retry condition specifică pentru provideri de payout
 */
export function isPayoutRetryableError(error: any): boolean {
  // Retry pe erori de rețea sau server
  if (error?.status >= 500) return true;
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
  if (error?.message?.includes('timeout')) return true;
  
  // Nu retry pe erori de validare sau autentificare
  if (error?.status >= 400 && error?.status < 500) return false;
  
  return false;
}

/**
 * Retry condition specifică pentru provideri de refund
 */
export function isRefundRetryableError(error: any): boolean {
  return isPayoutRetryableError(error);
}

/**
 * Retry condition specifică pentru email providers
 */
export function isEmailRetryableError(error: any): boolean {
  // Retry pe rate limiting și server errors
  if (error?.status === 429) return true; // Rate limit
  if (error?.status >= 500) return true;
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
  if (error?.message?.includes('timeout')) return true;
  
  return false;
}
