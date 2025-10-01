// Checkout types and DTOs for Week 4 MVP frontend

export type CheckoutAddress = {
  name: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  zip: string;
  note?: string;
};

export type ShippingRate = {
  carrier: 'Cargus' | 'DPD';
  service: string;
  fee_cents: number;
};

export type OrderCreatePayload = {
  address: CheckoutAddress;
  shipping: ShippingRate;
};

export type OrderPublic = {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled';
  items: Array<{
    product_id: string;
    title: string;
    qty: number;
    unit_price_cents: number;
    subtotal_cents: number;
    image_url?: string;
    seller_id: string;
  }>;
  totals: {
    subtotal_cents: number;
    shipping_fee_cents: number;
    total_cents: number;
    currency: 'RON';
  };
  payment_ref?: string | null;
};

export type CartItem = {
  id: string;
  title: string;
  qty: number;
  price_cents: number;
  image_url?: string;
};

export type OrderSummaryProps = {
  items: CartItem[];
  subtotal_cents: number;
  shipping_fee_cents: number;
  total_cents: number;
  currency: string;
};

export type NetopiaInitResponse = {
  gateway: string;
  formHtml?: string;
  redirectUrl?: string;
};
