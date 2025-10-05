/**
 * Queue Worker for Chatbot
 * Handles timeouts, reminders, and follow-up tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWaitingTickets, updateTicketState, addMessage } from '@/lib/services/ticket-service';
import { searchOrder } from '@/lib/services/order-service';
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import { formatPhoneForWhatsApp } from '@/lib/whatsapp';

/**
 * POST /api/chatbot/queue/process - Process queue tasks
 * This would typically be called by a cron job or queue system
 */
export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json();
    
    switch (task) {
      case 'check_timeouts':
        await checkTimeouts();
        break;
      case 'send_reminders':
        await sendReminders();
        break;
      case 'escalate_tickets':
        await escalateTickets();
        break;
      default:
        return NextResponse.json({ error: 'Unknown task' }, { status: 400 });
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Queue worker error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check for tickets that have timed out
 */
async function checkTimeouts() {
  try {
    const waitingTickets = await getWaitingTickets();
    const now = new Date();
    
    for (const ticket of waitingTickets) {
      const ticketAge = now.getTime() - new Date(ticket.created_at).getTime();
      const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      if (ticketAge > twoHours) {
        console.log(`Ticket ${ticket.id} has timed out (${Math.round(ticketAge / 60000)} minutes old)`);
        
        // Mark ticket as needing reminder
        await updateTicketState(ticket.id, 'waiting_seller', 'TIMEOUT_CHECKED');
        
        // Log the timeout check
        await addMessage(ticket.id, 'bot', 'Timeout check performed', 'system');
      }
    }
    
    console.log(`Checked ${waitingTickets.length} waiting tickets for timeouts`);
    
  } catch (error) {
    console.error('Error checking timeouts:', error);
  }
}

/**
 * Send reminders to sellers who haven't responded
 */
async function sendReminders() {
  try {
    const waitingTickets = await getWaitingTickets();
    const now = new Date();
    
    for (const ticket of waitingTickets) {
      const ticketAge = now.getTime() - new Date(ticket.created_at).getTime();
      const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      // Send reminder after 2 hours
      if (ticketAge > twoHours && ticketAge < (4 * 60 * 60 * 1000)) { // Between 2-4 hours
        await sendSellerReminder(ticket);
      }
    }
    
    console.log(`Processed reminders for ${waitingTickets.length} tickets`);
    
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

/**
 * Send reminder to specific seller
 */
async function sendSellerReminder(ticket: any) {
  try {
    // Get order details
    const orderResult = await searchOrder(ticket.order_id);
    
    if (!orderResult.found || !orderResult.order) {
      console.error(`Order not found for ticket ${ticket.id}`);
      return;
    }

    const order = orderResult.order;
    
    if (!order.seller.whatsapp_business_number) {
      console.error(`No WhatsApp number for seller ${order.seller.id}`);
      return;
    }

    const sellerPhone = formatPhoneForWhatsApp(order.seller.whatsapp_business_number);
    const reminderMessage = WHATSAPP_TEMPLATES.SELLER_REMINDER.toSeller(
      order.seller.name,
      order.id
    );

    const result = await sendWhatsAppMessage(sellerPhone, reminderMessage);
    
    if (result.success) {
      console.log(`Reminder sent to seller ${order.seller.name} for ticket ${ticket.id}`);
      
      // Log the reminder
      await addMessage(ticket.id, 'bot', reminderMessage, 'whatsapp');
      
    } else {
      console.error(`Failed to send reminder to seller ${order.seller.name}:`, result.error);
    }
    
  } catch (error) {
    console.error('Error sending seller reminder:', error);
  }
}

/**
 * Escalate tickets that haven't been answered for too long
 */
async function escalateTickets() {
  try {
    const waitingTickets = await getWaitingTickets();
    const now = new Date();
    
    for (const ticket of waitingTickets) {
      const ticketAge = now.getTime() - new Date(ticket.created_at).getTime();
      const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      
      // Escalate after 6 hours
      if (ticketAge > sixHours) {
        await escalateTicket(ticket);
      }
    }
    
    console.log(`Processed escalations for ${waitingTickets.length} tickets`);
    
  } catch (error) {
    console.error('Error escalating tickets:', error);
  }
}

/**
 * Escalate specific ticket to support
 */
async function escalateTicket(ticket: any) {
  try {
    // Get order details
    const orderResult = await searchOrder(ticket.order_id);
    
    if (!orderResult.found || !orderResult.order) {
      console.error(`Order not found for ticket ${ticket.id}`);
      return;
    }

    const order = orderResult.order;
    
    // Update ticket state
    await updateTicketState(ticket.id, 'closed', 'ESCALATED_TO_SUPPORT');
    
    // Log escalation
    const escalationMessage = WHATSAPP_TEMPLATES.ESCALATION.toSupport(
      order.id,
      order.seller.name
    );
    
    await addMessage(ticket.id, 'bot', escalationMessage, 'system');
    
    // Here you would typically:
    // 1. Send notification to support team
    // 2. Create a support ticket
    // 3. Send email to support
    // 4. Update internal dashboard
    
    console.log(`Ticket ${ticket.id} escalated to support`);
    
    // For MVP, we'll just log it
    console.log('ESCALATION:', escalationMessage);
    
  } catch (error) {
    console.error('Error escalating ticket:', error);
  }
}

/**
 * GET /api/chatbot/queue/stats - Get queue statistics
 */
export async function GET() {
  try {
    const waitingTickets = await getWaitingTickets();
    const now = new Date();
    
    const stats = {
      total_waiting: waitingTickets.length,
      needs_reminder: 0,
      needs_escalation: 0,
      tickets: waitingTickets.map(ticket => {
        const age = now.getTime() - new Date(ticket.created_at).getTime();
        const ageMinutes = Math.round(age / 60000);
        
        let status = 'waiting';
        if (age > (6 * 60 * 60 * 1000)) {
          status = 'needs_escalation';
        } else if (age > (2 * 60 * 60 * 1000)) {
          status = 'needs_reminder';
        }
        
        return {
          id: ticket.id,
          order_id: ticket.order_id,
          age_minutes: ageMinutes,
          status: status,
          created_at: ticket.created_at
        };
      })
    };
    
    // Count by status
    stats.needs_reminder = stats.tickets.filter(t => t.status === 'needs_reminder').length;
    stats.needs_escalation = stats.tickets.filter(t => t.status === 'needs_escalation').length;
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Utility function to run queue tasks manually
 * This would typically be called by a cron job
 */
async function runQueueTasks() {
  console.log('Starting queue tasks...');
  
  try {
    await checkTimeouts();
    await sendReminders();
    await escalateTickets();
    
    console.log('Queue tasks completed successfully');
    
  } catch (error) {
    console.error('Queue tasks failed:', error);
  }
}
