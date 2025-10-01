import { Courier, AWBRequest, AWBResult } from './providers';

export class DPDProvider implements Courier {
  name = 'dpd' as const;
  
  private apiKey: string;
  private apiBase: string;
  
  constructor() {
    this.apiKey = process.env.DPD_API_KEY || '';
    this.apiBase = process.env.DPD_API_BASE || 'https://api.dpd.ro';
    
    if (!this.apiKey) {
      throw new Error('DPD_API_KEY environment variable is required');
    }
  }
  
  async createAwb(req: AWBRequest): Promise<AWBResult> {
    try {
      // Mock implementation - in real scenario, this would call DPD API
      const response = await fetch(`${this.apiBase}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderReference: req.orderId,
          recipient: {
            name: req.to.name,
            address: req.to.address,
            city: req.to.city,
            county: req.to.county,
            postalCode: req.to.postalCode,
            country: req.to.country,
            phone: req.to.phone,
            email: req.to.email,
          },
          weight: req.weightKg,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`DPD API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        awbNumber: data.trackingNumber,
        awbLabelUrl: data.labelUrl,
        carrierMeta: {
          provider: 'dpd',
          trackingUrl: data.trackingUrl,
          service: data.service,
        },
      };
    } catch (error) {
      // If API call fails, throw error to allow fallback to next provider
      throw new Error(`DPD provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
