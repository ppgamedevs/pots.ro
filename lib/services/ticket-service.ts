/**
 * Ticket Management System
 * Handles support tickets and conversation flow
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

export interface Ticket {
  id: string;
  order_id: string;
  type: 'order_eta' | 'order_cancel' | 'return_policy';
  state: 'open' | 'waiting_seller' | 'answered' | 'closed';
  last_message?: string;
  assignee_seller_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender: 'customer' | 'bot' | 'seller';
  body: string;
  channel: 'whatsapp' | 'web' | 'email' | 'system';
  created_at: Date;
}

/**
 * Create a new ticket
 */
export async function createTicket(
  orderId: string,
  type: Ticket['type'] = 'order_eta',
  assigneeSellerId?: string
): Promise<Ticket | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO tickets (order_id, type, state, assignee_seller_id, created_at, updated_at)
      VALUES (${orderId}, ${type}, 'open', ${assigneeSellerId || null}, NOW(), NOW())
      RETURNING id, order_id, type, state, last_message, assignee_seller_id, created_at, updated_at
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      order_id: row.order_id as string,
      type: row.type as Ticket['type'],
      state: row.state as Ticket['state'],
      last_message: row.last_message as string,
      assignee_seller_id: row.assignee_seller_id as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}

/**
 * Find existing open ticket for order
 */
export async function findOpenTicket(orderId: string, type?: Ticket['type']): Promise<Ticket | null> {
  try {
    const whereClause = type 
      ? sql`WHERE order_id = ${orderId} AND type = ${type} AND state IN ('open', 'waiting_seller')`
      : sql`WHERE order_id = ${orderId} AND state IN ('open', 'waiting_seller')`;

    const result = await db.execute(sql`
      SELECT id, order_id, type, state, last_message, assignee_seller_id, created_at, updated_at
      FROM tickets
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      order_id: row.order_id as string,
      type: row.type as Ticket['type'],
      state: row.state as Ticket['state'],
      last_message: row.last_message as string,
      assignee_seller_id: row.assignee_seller_id as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date
    };
  } catch (error) {
    console.error('Error finding open ticket:', error);
    return null;
  }
}

/**
 * Update ticket state
 */
export async function updateTicketState(
  ticketId: string, 
  state: Ticket['state'],
  lastMessage?: string
): Promise<boolean> {
  try {
    await db.execute(sql`
      UPDATE tickets 
      SET state = ${state}, 
          last_message = ${lastMessage || null},
          updated_at = NOW()
      WHERE id = ${ticketId}
    `);

    return true;
  } catch (error) {
    console.error('Error updating ticket state:', error);
    return false;
  }
}

/**
 * Add message to ticket
 */
export async function addMessage(
  ticketId: string,
  sender: Message['sender'],
  body: string,
  channel: Message['channel']
): Promise<Message | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO messages (ticket_id, sender, body, channel, created_at)
      VALUES (${ticketId}, ${sender}, ${body}, ${channel}, NOW())
      RETURNING id, ticket_id, sender, body, channel, created_at
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      ticket_id: row.ticket_id as string,
      sender: row.sender as Message['sender'],
      body: row.body as string,
      channel: row.channel as Message['channel'],
      created_at: row.created_at as Date
    };
  } catch (error) {
    console.error('Error adding message:', error);
    return null;
  }
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(ticketId: string): Promise<Message[]> {
  try {
    const result = await db.execute(sql`
      SELECT id, ticket_id, sender, body, channel, created_at
      FROM messages
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at ASC
    `);

    return result.rows.map((row: any) => ({
      id: row.id as string,
      ticket_id: row.ticket_id as string,
      sender: row.sender as Message['sender'],
      body: row.body as string,
      channel: row.channel as Message['channel'],
      created_at: row.created_at as Date
    }));
  } catch (error) {
    console.error('Error getting ticket messages:', error);
    return [];
  }
}

/**
 * Find ticket by seller phone number and order context
 */
export async function findTicketBySellerContext(
  sellerPhone: string,
  orderId?: string
): Promise<Ticket | null> {
  try {
    let whereClause = sql`WHERE t.assignee_seller_id IN (
      SELECT se.seller_id 
      FROM sellers_extended se 
      WHERE se.phone = ${sellerPhone} OR se.whatsapp_business_number = ${sellerPhone}
    ) AND t.state = 'waiting_seller'`;

    if (orderId) {
      whereClause = sql`${whereClause} AND t.order_id = ${orderId}`;
    }

    const result = await db.execute(sql`
      SELECT t.id, t.order_id, t.type, t.state, t.last_message, t.assignee_seller_id, t.created_at, t.updated_at
      FROM tickets t
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      order_id: row.order_id as string,
      type: row.type as Ticket['type'],
      state: row.state as Ticket['state'],
      last_message: row.last_message as string,
      assignee_seller_id: row.assignee_seller_id as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date
    };
  } catch (error) {
    console.error('Error finding ticket by seller context:', error);
    return null;
  }
}

/**
 * Get tickets waiting for seller response
 */
export async function getWaitingTickets(): Promise<Ticket[]> {
  try {
    const result = await db.execute(sql`
      SELECT t.id, t.order_id, t.type, t.state, t.last_message, t.assignee_seller_id, t.created_at, t.updated_at
      FROM tickets t
      WHERE t.state = 'waiting_seller'
      ORDER BY t.created_at ASC
    `);

    return result.rows.map((row: any) => ({
      id: row.id as string,
      order_id: row.order_id as string,
      type: row.type as Ticket['type'],
      state: row.state as Ticket['state'],
      last_message: row.last_message as string,
      assignee_seller_id: row.assignee_seller_id as string,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date
    }));
  } catch (error) {
    console.error('Error getting waiting tickets:', error);
    return [];
  }
}

/**
 * Close ticket
 */
export async function closeTicket(ticketId: string): Promise<boolean> {
  return updateTicketState(ticketId, 'closed');
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
  open: number;
  waiting_seller: number;
  answered: number;
  closed: number;
}> {
  try {
    const result = await db.execute(sql`
      SELECT state, COUNT(*) as count
      FROM tickets
      GROUP BY state
    `);

    const stats = {
      open: 0,
      waiting_seller: 0,
      answered: 0,
      closed: 0
    };

    result.rows.forEach((row: any) => {
      stats[row.state as keyof typeof stats] = parseInt(row.count as string);
    });

    return stats;
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return { open: 0, waiting_seller: 0, answered: 0, closed: 0 };
  }
}
