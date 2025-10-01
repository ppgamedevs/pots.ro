import { Courier, AWBRequest, AWBResult, CourierName } from './providers';
import { CargusProvider } from './cargus';
import { DPDProvider } from './dpd';
import { MockProvider } from './mock';

export class ShippingProviderSelector {
  private providers: Courier[];
  
  constructor() {
    this.providers = [];
    
    // Try to initialize providers in order of preference
    try {
      this.providers.push(new CargusProvider());
    } catch (error) {
      console.warn('Cargus provider not available:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    try {
      this.providers.push(new DPDProvider());
    } catch (error) {
      console.warn('DPD provider not available:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Always add mock provider as fallback
    this.providers.push(new MockProvider());
  }
  
  /**
   * Create AWB using the first available provider
   * @param req AWB request
   * @returns AWB result
   */
  async createAwb(req: AWBRequest): Promise<AWBResult> {
    let lastError: Error | null = null;
    
    for (const provider of this.providers) {
      try {
        const result = await provider.createAwb(req);
        console.log(`AWB created successfully using ${provider.name} provider`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Provider ${provider.name} failed:`, lastError.message);
        
        // If this is the last provider (mock), don't continue trying
        if (provider.name === 'mock') {
          break;
        }
      }
    }
    
    // This should never happen since mock provider should always work
    throw lastError || new Error('No shipping providers available');
  }
  
  /**
   * Get list of available providers
   * @returns Array of provider names
   */
  getAvailableProviders(): CourierName[] {
    return this.providers.map(p => p.name);
  }
  
  /**
   * Check if a specific provider is available
   * @param providerName Provider name to check
   * @returns true if provider is available
   */
  isProviderAvailable(providerName: CourierName): boolean {
    return this.providers.some(p => p.name === providerName);
  }
}

// Export singleton instance
export const shippingProvider = new ShippingProviderSelector();
