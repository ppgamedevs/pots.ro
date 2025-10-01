import { Courier, AWBRequest, AWBResult } from './providers';

export class MockProvider implements Courier {
  name = 'mock' as const;
  
  async createAwb(req: AWBRequest): Promise<AWBResult> {
    // Generate deterministic fake AWB number
    const orderIdSuffix = req.orderId.slice(0, 6);
    const timestampSuffix = Date.now() % 10000;
    const awbNumber = `MOCK-${orderIdSuffix}-${timestampSuffix}`;
    
    // Generate mock label URL pointing to our proxy route
    const awbLabelUrl = `/api/shipping/awb/${req.orderId}/label`;
    
    return {
      awbNumber,
      awbLabelUrl,
      carrierMeta: {
        provider: 'mock',
        weight: req.weightKg,
        createdAt: new Date().toISOString(),
        mockData: true,
      },
    };
  }
}
