/**
 * Order Service - manages order data and status
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq, desc } from 'drizzle-orm';

export interface OrderWithDetails {
  id: string;
  status: string;
  eta_text?: string;
  tracking?: string;
  seller: {
    id: string;
    name: string;
    phone?: string;
    whatsapp_business_number?: string;
  };
  buyer: {
    id: string;
    name: string;
    phone?: string;
    whatsapp_opt_in: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

export interface OrderSearchResult {
  order?: OrderWithDetails;
  found: boolean;
  searchMethod: 'order_id' | 'email' | 'phone';
}

/**
 * Find order by ID
 */
export async function findOrderById(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        o.id, o.status, o.eta_text, o.tracking, o.created_at, o.updated_at,
        s.id as seller_id, s.brand_name as seller_name,
        b.id as buyer_id, b.name as buyer_name
      FROM orders o
      INNER JOIN sellers s ON o.seller_id = s.id
      INNER JOIN buyers b ON o.buyer_id = b.id
      WHERE o.id = ${orderId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Get extended seller info
    const sellerExt = await db.execute(sql`
      SELECT phone, whatsapp_business_number 
      FROM sellers_extended 
      WHERE seller_id = ${row.seller_id}
    `);
    
    // Get extended buyer info  
    const buyerExt = await db.execute(sql`
      SELECT phone, whatsapp_opt_in 
      FROM buyers 
      WHERE id = ${row.buyer_id}
    `);

    return {
      id: row.id as string,
      status: row.status as string,
      eta_text: row.eta_text as string,
      tracking: row.tracking as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      seller: {
        id: row.seller_id as string,
        name: row.seller_name as string,
        phone: sellerExt.rows[0]?.phone as string,
        whatsapp_business_number: sellerExt.rows[0]?.whatsapp_business_number as string
      },
      buyer: {
        id: row.buyer_id as string,
        name: row.buyer_name as string,
        phone: buyerExt.rows[0]?.phone as string,
        whatsapp_opt_in: buyerExt.rows[0]?.whatsapp_opt_in as boolean || false
      }
    };
  } catch (error) {
    console.error('Error finding order by ID:', error);
    return null;
  }
}

/**
 * Find order by email or phone
 */
export async function findOrderByContact(email?: string, phone?: string): Promise<OrderWithDetails | null> {
  if (!email && !phone) {
    return null;
  }

  try {
    // First find the user by email
    let userId: string | null = null;
    
    if (email) {
      const userResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `);
      
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id as string;
      }
    }

    // If no user found by email, try to find by phone in buyers table
    if (!userId && phone) {
      const buyerResult = await db.execute(sql`
        SELECT user_id FROM buyers WHERE phone = ${phone} LIMIT 1
      `);
      
      if (buyerResult.rows.length > 0) {
        userId = buyerResult.rows[0].user_id as string;
      }
    }

    if (!userId) {
      return null;
    }

    // Find the most recent order for this user
    const orderResult = await db.execute(sql`
      SELECT 
        o.id, o.status, o.eta_text, o.tracking, o.created_at, o.updated_at,
        s.id as seller_id, s.brand_name as seller_name,
        b.id as buyer_id, b.name as buyer_name
      FROM orders o
      INNER JOIN sellers s ON o.seller_id = s.id
      INNER JOIN buyers b ON o.buyer_id = b.id
      WHERE b.user_id = ${userId}
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      return null;
    }

    const row = orderResult.rows[0];
    
    // Get extended info (same as findOrderById)
    const sellerExt = await db.execute(sql`
      SELECT phone, whatsapp_business_number 
      FROM sellers_extended 
      WHERE seller_id = ${row.seller_id}
    `);
    
    const buyerExt = await db.execute(sql`
      SELECT phone, whatsapp_opt_in 
      FROM buyers 
      WHERE id = ${row.buyer_id}
    `);

    return {
      id: row.id as string,
      status: row.status as string,
      eta_text: row.eta_text as string,
      tracking: row.tracking as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      seller: {
        id: row.seller_id as string,
        name: row.seller_name as string,
        phone: sellerExt.rows[0]?.phone as string,
        whatsapp_business_number: sellerExt.rows[0]?.whatsapp_business_number as string
      },
      buyer: {
        id: row.buyer_id as string,
        name: row.buyer_name as string,
        phone: buyerExt.rows[0]?.phone as string,
        whatsapp_opt_in: buyerExt.rows[0]?.whatsapp_opt_in as boolean || false
      }
    };
  } catch (error) {
    console.error('Error finding order by contact:', error);
    return null;
  }
}

/**
 * Search for order using multiple methods
 */
export async function searchOrder(
  orderId?: string, 
  email?: string, 
  phone?: string
): Promise<OrderSearchResult> {
  // Try order ID first
  if (orderId) {
    const order = await findOrderById(orderId);
    if (order) {
      return {
        order,
        found: true,
        searchMethod: 'order_id'
      };
    }
  }

  // Try email/phone
  const order = await findOrderByContact(email, phone);
  if (order) {
    return {
      order,
      found: true,
      searchMethod: email ? 'email' : 'phone'
    };
  }

  return {
    found: false,
    searchMethod: orderId ? 'order_id' : (email ? 'email' : 'phone')
  };
}

/**
 * Update order ETA
 */
export async function updateOrderETA(orderId: string, etaText: string): Promise<boolean> {
  try {
    // Update main orders table
    await db.execute(sql`
      UPDATE orders 
      SET eta_text = ${etaText}, updated_at = NOW()
      WHERE id = ${orderId}
    `);

    // Also update extended table if it exists
    await db.execute(sql`
      INSERT INTO orders_extended (order_id, eta_text, updated_at)
      VALUES (${orderId}, ${etaText}, NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET eta_text = ${etaText}, updated_at = NOW()
    `);

    return true;
  } catch (error) {
    console.error('Error updating order ETA:', error);
    return false;
  }
}

/**
 * Update order tracking
 */
export async function updateOrderTracking(orderId: string, tracking: string): Promise<boolean> {
  try {
    await db.execute(sql`
      UPDATE orders 
      SET tracking = ${tracking}, updated_at = NOW()
      WHERE id = ${orderId}
    `);

    await db.execute(sql`
      INSERT INTO orders_extended (order_id, tracking, updated_at)
      VALUES (${orderId}, ${tracking}, NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET tracking = ${tracking}, updated_at = NOW()
    `);

    return true;
  } catch (error) {
    console.error('Error updating order tracking:', error);
    return false;
  }
}

/**
 * Check if order has clear status and ETA
 */
export function hasClearStatus(order: OrderWithDetails): boolean {
  const clearStatuses = ['paid', 'packed', 'shipped', 'delivered'];
  return clearStatuses.includes(order.status) && !!order.eta_text;
}

/**
 * Get order status message for customer
 */
export function getOrderStatusMessage(order: OrderWithDetails): string {
  const statusMessages = {
    'pending': 'Comanda este în procesare.',
    'paid': 'Comanda a fost confirmată și este pregătită.',
    'packed': 'Comanda a fost ambalată și este gata pentru livrare.',
    'shipped': 'Comanda este în curs de livrare.',
    'delivered': 'Comanda a fost livrată.',
    'cancelled': 'Comanda a fost anulată.',
    'refunded': 'Comanda a fost rambursată.'
  };

  const baseMessage = statusMessages[order.status as keyof typeof statusMessages] || 'Status necunoscut.';
  
  if (order.eta_text) {
    return `${baseMessage} ETA: ${order.eta_text}`;
  }
  
  return baseMessage;
}
