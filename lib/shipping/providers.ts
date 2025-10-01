export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface AWBRequest {
  orderId: string;
  to: ShippingAddress;
  weightKg: number;
}

export interface AWBResult {
  awbNumber: string;
  awbLabelUrl: string;
  carrierMeta?: any;
}

export interface Courier {
  name: 'cargus' | 'dpd' | 'mock';
  createAwb(req: AWBRequest): Promise<AWBResult>;
}

export type CourierName = 'cargus' | 'dpd' | 'mock';
