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
  deliveredAt?: string | null;
  canceledReason?: string | null;
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

export type Cart = {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  sellerId: string;
};

export type SellerPublic = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type SellerProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  status: 'draft' | 'active' | 'archived';
  images: string[];
  stock: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type SellerProductListItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: 'draft' | 'active' | 'archived';
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type SellerProductsResponse = {
  products: SellerProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProductCard = {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  seller: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
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

export type InvoicePayload = {
  orderId: string;
  buyer: { 
    name: string; 
    email: string; 
    company?: string; 
    vat?: string; 
  };
  items: Array<{ 
    name: string; 
    qty: number; 
    unitPrice: number; 
    vatRate: number; 
  }>;
  totals: { 
    subtotal: number; 
    shipping: number; 
    vat: number; 
    total: number; 
  };
};

export type EmailEvent = {
  to: string;
  template: 'OrderPaid' | 'OrderShipped' | 'OrderDelivered' | 'MessageNotification';
  data: Record<string, any>;
  attachments?: Array<{ 
    filename: string; 
    contentType: string; 
    url?: string; 
    content?: string; 
  }>;
};

export type MessageResponse = {
  ok: boolean;
  message?: Message;
  warning?: boolean;
  error?: string;
};