import { Courier, AWBRequest, AWBResult } from './providers';

export class CargusProvider implements Courier {
  name = 'cargus' as const;
  
  private apiKey: string;
  private apiBase: string;
  
  constructor() {
    this.apiKey = process.env.CARGUS_API_KEY || '';
    this.apiBase = process.env.CARGUS_API_BASE || 'https://api.cargus.ro';
    
    if (!this.apiKey) {
      throw new Error('CARGUS_API_KEY environment variable is required');
    }
  }
  
  async createAwb(req: AWBRequest): Promise<AWBResult> {
    try {
      // Mock implementation - in real scenario, this would call Cargus API
      const response = await fetch(`${this.apiBase}/awb`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: req.orderId,
          recipient: {
            name: req.to.name,
            address: req.to.address,
            city: req.to.city,
            county: req.to.county,
            postalCode: req.to.postalCode,
            country: req.to.county,
            phone: req.to.phone,
            email: req.to.email,
          },
          weight: req.weightKg,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Cargus API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        awbNumber: data.awbNumber,
        awbLabelUrl: data.labelUrl,
        carrierMeta: {
          provider: 'cargus',
          trackingUrl: data.trackingUrl,
          service: data.service,
        },
      };
    } catch (error) {
      // If API call fails, throw error to allow fallback to next provider
      throw new Error(`Cargus provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
