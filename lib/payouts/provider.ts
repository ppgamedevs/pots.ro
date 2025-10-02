/**
 * Provider payout pentru Pots.ro
 * Suportă Netopia, transfer bancar și mock pentru dezvoltare
 */

import { withRetry, isPayoutRetryableError } from '@/lib/util/retry';

export type PayoutInput = {
  payoutId: string;
  sellerId: string;
  amount: number;
  currency: 'RON' | 'EUR';
};

export type PayoutResult = {
  ok: boolean;
  providerRef?: string;
  failureReason?: string;
};

export interface PayoutProvider {
  send(input: PayoutInput): Promise<PayoutResult>;
}

/**
 * Provider Mock pentru dezvoltare și testare
 */
export class MockPayoutProvider implements PayoutProvider {
  async send(input: PayoutInput): Promise<PayoutResult> {
    // Simulează delay-ul de procesare
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulează eroare ocazională (5% șanse)
    if (Math.random() < 0.05) {
      return {
        ok: false,
        failureReason: 'Eroare simulată de procesare'
      };
    }
    
    return {
      ok: true,
      providerRef: `MOCK-${input.payoutId}-${Date.now()}`
    };
  }
}

/**
 * Provider Netopia pentru plăți către vânzători
 */
export class NetopiaPayoutProvider implements PayoutProvider {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NETOPIA_API_KEY || '';
    this.merchantId = process.env.NETOPIA_MERCHANT_ID || '';
    this.baseUrl = process.env.NETOPIA_API_URL || 'https://api.netopia.com';
    
    if (!this.apiKey || !this.merchantId) {
      throw new Error('NETOPIA_API_KEY și NETOPIA_MERCHANT_ID sunt obligatorii');
    }
  }

  async send(input: PayoutInput): Promise<PayoutResult> {
    const result = await withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/payouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.merchantId
          },
          body: JSON.stringify({
            amount: input.amount,
            currency: input.currency,
            recipient: {
              sellerId: input.sellerId,
              payoutId: input.payoutId
            },
            reference: `PAYOUT-${input.payoutId}`
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Netopia API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;
      },
      {
        retryCondition: isPayoutRetryableError,
        maxAttempts: 3
      }
    );

    if (result.success) {
      return {
        ok: true,
        providerRef: result.data?.transactionId || `NETOPIA-${input.payoutId}`
      };
    } else {
      return {
        ok: false,
        failureReason: result.error?.message || 'Eroare necunoscută la Netopia'
      };
    }
  }
}

/**
 * Provider Transfer Bancar pentru plăți către vânzători
 */
export class TransferPayoutProvider implements PayoutProvider {
  private apiKey: string;
  private senderIban: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TRANSFER_BANK_API_KEY || '';
    this.senderIban = process.env.TRANSFER_IBAN_SENDER || '';
    this.baseUrl = process.env.TRANSFER_BANK_API_URL || 'https://api.transferbank.ro';
    
    if (!this.apiKey || !this.senderIban) {
      throw new Error('TRANSFER_BANK_API_KEY și TRANSFER_IBAN_SENDER sunt obligatorii');
    }
  }

  async send(input: PayoutInput): Promise<PayoutResult> {
    const result = await withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/transfers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromIban: this.senderIban,
            amount: input.amount,
            currency: input.currency,
            reference: `PAYOUT-${input.payoutId}`,
            description: `Plată către vânzător ${input.sellerId}`,
            recipient: {
              sellerId: input.sellerId,
              payoutId: input.payoutId
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Transfer Bank API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;
      },
      {
        retryCondition: isPayoutRetryableError,
        maxAttempts: 3
      }
    );

    if (result.success) {
      return {
        ok: true,
        providerRef: result.data?.transferId || `TRANSFER-${input.payoutId}`
      };
    } else {
      return {
        ok: false,
        failureReason: result.error?.message || 'Eroare necunoscută la Transfer Bank'
      };
    }
  }
}

/**
 * Factory pentru a obține provider-ul de payout configurat
 */
export function getPayoutProvider(): PayoutProvider {
  const provider = process.env.PAYOUT_PROVIDER || 'mock';
  
  switch (provider) {
    case 'netopia':
      try {
        return new NetopiaPayoutProvider();
      } catch (error) {
        console.warn('Netopia provider nu poate fi inițializat, folosind mock:', error);
        return new MockPayoutProvider();
      }
    
    case 'transfer':
      try {
        return new TransferPayoutProvider();
      } catch (error) {
        console.warn('Transfer provider nu poate fi inițializat, folosind mock:', error);
        return new MockPayoutProvider();
      }
    
    case 'mock':
    default:
      console.log('Folosind MockPayoutProvider pentru dezvoltare');
      return new MockPayoutProvider();
  }
}

/**
 * Helper pentru validarea input-ului de payout
 */
export function validatePayoutInput(input: PayoutInput): { valid: boolean; error?: string } {
  if (!input.payoutId || typeof input.payoutId !== 'string') {
    return { valid: false, error: 'payoutId este obligatoriu' };
  }
  
  if (!input.sellerId || typeof input.sellerId !== 'string') {
    return { valid: false, error: 'sellerId este obligatoriu' };
  }
  
  if (!input.amount || typeof input.amount !== 'number' || input.amount <= 0) {
    return { valid: false, error: 'amount trebuie să fie un număr pozitiv' };
  }
  
  if (!['RON', 'EUR'].includes(input.currency)) {
    return { valid: false, error: 'currency trebuie să fie RON sau EUR' };
  }
  
  return { valid: true };
}
