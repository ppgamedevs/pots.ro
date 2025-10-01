export type OrderStatus = 'pending' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'canceled' | 'refunded';
export type DeliveryStatus = 'in_transit' | 'out_for_delivery' | 'delivered' | 'return' | null;

export type OrderItem = {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  sellerId: string;
};

export type OrderDetail = {
  id: string;
  createdAt: string;
  buyerEmail?: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  awbNumber?: string | null;
  awbLabelUrl?: string | null;
  shippingAddress: Record<string, any>;
  items: OrderItem[];
  totals: { subtotal: number; shipping: number; tax: number; total: number; };
};

export type Conversation = { 
  id: string; 
  orderId: string; 
  buyerId: string; 
  sellerId: string; 
};

export type Message = { 
  id: string; 
  author: { id: string; role: 'buyer' | 'seller' | 'admin' }; 
  body: string; 
  createdAt: string; 
  redacted?: boolean; 
};

export type Paged<T> = { 
  data: T[]; 
  total: number; 
  page: number; 
  pageSize: number; 
};

export type OrderFilters = {
  status?: OrderStatus;
  q?: string;
  from?: string;
  to?: string;
  carrier?: string;
  page?: number;
};

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  details?: any;
};

export type MessageResponse = {
  ok: boolean;
  message?: Message;
  warning?: boolean;
  error?: string;
};