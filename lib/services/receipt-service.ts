/**
 * Receipt Service - Professional receipt data preparation and validation
 * Fetches complete order data (buyer, seller, products) and transforms it
 * to Smartbill API format with comprehensive validation and error handling.
 */

import { db } from '@/db';
import { orders, orderItems, products, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export interface ReceiptBuyer {
  name: string;
  email?: string;
  phone?: string;
  cui?: string;
  address: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface ReceiptSeller {
  name: string;
  legalName?: string;
  cui?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
  };
}

export interface ReceiptItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
}

export interface ReceiptTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  vat: number;
  total: number;
}

export interface ReceiptData {
  buyer: ReceiptBuyer;
  seller: ReceiptSeller;
  order: {
    orderNumber: string;
    orderId: string;
    paymentRef?: string;
    paidAt: Date;
    currency: string;
  };
  items: ReceiptItem[];
  totals: ReceiptTotals;
}

/**
 * Format address object from various sources
 */
function formatAddress(address: any): ReceiptBuyer['address'] {
  if (!address) return {};
  
  // Handle different address formats
  if (typeof address === 'string') {
    return { street: address };
  }
  
  if (typeof address === 'object') {
    return {
      street: address.street || address.address || address.addressLine1,
      city: address.city || address.locality,
      county: address.county || address.state || address.region,
      postalCode: address.postalCode || address.postcode || address.zipCode,
      country: address.country || 'România',
    };
  }
  
  return {};
}

/**
 * Validate email format
 */
function isValidEmail(email?: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate CUI format (Romanian tax ID)
 */
function isValidCUI(cui?: string): boolean {
  if (!cui) return true; // Optional field
  // Romanian CUI format: RO followed by 2-10 digits
  const cuiRegex = /^RO\d{2,10}$/i;
  return cuiRegex.test(cui);
}

/**
 * Fetch complete receipt data for an order
 */
export async function fetchReceiptData(orderId: string): Promise<ReceiptData> {
  // Fetch order with buyer and seller info
  const orderResult = await db
    .select({
      order: orders,
      buyer: users,
      seller: sellers,
    })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .innerJoin(sellers, eq(orders.sellerId, sellers.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (orderResult.length === 0) {
    throw new Error(`Order ${orderId} not found`);
  }

  const { order, buyer: buyerUser, seller } = orderResult[0];

  // Validate order is paid
  if (order.status !== 'paid') {
    throw new Error(`Order ${orderId} is not paid. Current status: ${order.status}`);
  }

  if (!order.paidAt) {
    throw new Error(`Order ${orderId} has no paidAt timestamp`);
  }

  // Fetch order items with product details
  const orderItemsResult = await db
    .select({
      orderItem: orderItems,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  if (orderItemsResult.length === 0) {
    throw new Error(`Order ${orderId} has no items`);
  }

  // Prepare buyer information
  const shippingAddress = order.shippingAddress as any;
  const buyerAddress = formatAddress(shippingAddress?.address || shippingAddress);
  
  const buyer: ReceiptBuyer = {
    name: shippingAddress?.name || buyerUser.name || 'Unknown',
    email: shippingAddress?.email || buyerUser.email || undefined,
    phone: shippingAddress?.phone || undefined,
    cui: shippingAddress?.cui || undefined,
    address: buyerAddress,
  };

  // Validate buyer data
  if (!buyer.name || buyer.name.trim().length === 0) {
    throw new Error('Buyer name is required');
  }

  if (buyer.email && !isValidEmail(buyer.email)) {
    throw new Error(`Invalid buyer email format: ${buyer.email}`);
  }

  if (buyer.cui && !isValidCUI(buyer.cui)) {
    throw new Error(`Invalid buyer CUI format: ${buyer.cui}`);
  }

  // Prepare seller information
  const sellerAddress = seller.shippingPrefs ? formatAddress((seller.shippingPrefs as any)?.address) : undefined;
  
  const receiptSeller: ReceiptSeller = {
    name: seller.brandName || seller.legalName || 'Unknown Seller',
    legalName: seller.legalName || seller.brandName,
    cui: seller.cui || undefined,
    email: seller.email || undefined,
    phone: seller.phone || undefined,
    address: sellerAddress,
  };

  // Validate seller data
  if (!receiptSeller.name || receiptSeller.name.trim().length === 0) {
    throw new Error('Seller name is required');
  }

  if (receiptSeller.email && !isValidEmail(receiptSeller.email)) {
    throw new Error(`Invalid seller email format: ${receiptSeller.email}`);
  }

  if (receiptSeller.cui && !isValidCUI(receiptSeller.cui)) {
    throw new Error(`Invalid seller CUI format: ${receiptSeller.cui}`);
  }

  // Prepare items - Smartbill API handles VAT calculation based on vatRate
  // We pass the unit price as stored (which may include or exclude VAT depending on system design)
  // Smartbill will calculate VAT based on the vatRate provided
  const defaultVatRate = parseFloat(process.env.INVOICE_DEFAULT_VAT || '19');
  const items: ReceiptItem[] = orderItemsResult.map((row) => {
    const unitPrice = row.orderItem.unitPriceCents / 100;
    const quantity = row.orderItem.qty;
    const discountCents = row.orderItem.discountCents || 0;
    const discount = discountCents / 100;
    const subtotal = unitPrice * quantity;
    const totalPrice = subtotal - discount;
    const vatRate = defaultVatRate; // Could be product-specific in future
    
    // Calculate VAT amount for tracking (assuming price includes VAT)
    // This is for our internal tracking, Smartbill will recalculate
    const vatAmount = (totalPrice * vatRate) / (100 + vatRate);
    const priceWithoutVat = totalPrice - vatAmount;

    return {
      name: row.product.title || 'Product',
      sku: row.product.sku || undefined,
      quantity,
      unitPrice: unitPrice, // Unit price - Smartbill will calculate VAT based on vatRate
      totalPrice: totalPrice, // Total price for this line item
      vatRate,
      vatAmount, // Calculated VAT amount for internal tracking
    };
  });

  // Calculate totals for validation
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const itemsDiscount = orderItemsResult.reduce((sum, row) => sum + (row.orderItem.discountCents || 0), 0) / 100;
  const itemsVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const shipping = order.shippingFeeCents / 100;
  const shippingVat = (shipping * defaultVatRate) / (100 + defaultVatRate);
  const discount = order.totalDiscountCents / 100;
  const vat = itemsVat + shippingVat;
  const subtotal = itemsSubtotal;
  const total = subtotal + shipping - discount;

  // Validate totals match order totals (with small tolerance for rounding)
  const orderTotal = order.totalCents / 100;
  const totalDifference = Math.abs(total - orderTotal);
  if (totalDifference > 0.01) {
    console.warn(`[Receipt] Total mismatch for order ${orderId}: calculated ${total.toFixed(2)}, order ${orderTotal.toFixed(2)}, difference ${totalDifference.toFixed(2)}`);
  }

  const totals: ReceiptTotals = {
    subtotal,
    shipping,
    discount,
    vat,
    total: orderTotal, // Use order total as source of truth
  };

  return {
    buyer,
    seller: receiptSeller,
    order: {
      orderNumber: order.orderNumber,
      orderId: order.id,
      paymentRef: order.paymentRef || undefined,
      paidAt: order.paidAt,
      currency: order.currency,
    },
    items,
    totals,
  };
}

/**
 * Validate receipt data before sending to Smartbill
 */
export function validateReceiptData(data: ReceiptData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate buyer
  if (!data.buyer.name || data.buyer.name.trim().length === 0) {
    errors.push('Buyer name is required');
  }

  // Validate seller
  if (!data.seller.name || data.seller.name.trim().length === 0) {
    errors.push('Seller name is required');
  }

  // Validate items
  if (!data.items || data.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    data.items.forEach((item, index) => {
      if (!item.name || item.name.trim().length === 0) {
        errors.push(`Item ${index + 1}: name is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: quantity must be greater than 0`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: unit price cannot be negative`);
      }
      if (item.vatRate < 0 || item.vatRate > 100) {
        errors.push(`Item ${index + 1}: VAT rate must be between 0 and 100`);
      }
    });
  }

  // Validate totals
  if (data.totals.total <= 0) {
    errors.push('Total must be greater than 0');
  }

  // Validate currency
  if (!data.order.currency || !['RON', 'EUR'].includes(data.order.currency)) {
    errors.push(`Invalid currency: ${data.order.currency}. Must be RON or EUR`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
