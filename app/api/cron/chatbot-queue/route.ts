/**
 * Cron Job for Chatbot Queue Processing
 * Runs every 15 minutes to process timeouts, reminders, and escalations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWaitingTickets, updateTicketState, addMessage } from '@/lib/services/ticket-service';
import { searchOrder } from '@/lib/services/order-service';
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import { formatPhoneForWhatsApp } from '@/lib/whatsapp';

/**
 * POST /api/cron/chatbot-queue - Cron job endpoint
 * This would be called by Vercel Cron or external cron service
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting chatbot queue cron job...');
    
    // Run all queue tasks
    await runQueueTasks();
    
    console.log('Chatbot queue cron job completed');
    
    return NextResponse.json({ 
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot queue cron job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/cron/chatbot-queue - Health check for cron job
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'chatbot-queue-cron',
    timestamp: new Date().toISOString()
  });
}

/**
 * Run queue tasks
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
