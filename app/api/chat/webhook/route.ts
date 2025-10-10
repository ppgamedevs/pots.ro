/**
 * Chat Webhook Handler
 * Handles messages from web chat interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/nlu';
import { searchOrder, getOrderStatusMessage } from '@/lib/services/order-service';
import { createTicket, findOpenTicket, updateTicketState, addMessage } from '@/lib/services/ticket-service';
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import { formatPhoneForWhatsApp } from '@/lib/whatsapp';

export interface ChatMessage {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  order_id?: string;
}

export interface ChatSession {
  session_id: string;
  user_id?: string;
  phone?: string;
  email?: string;
  messages: ChatMessage[];
  current_order_id?: string;
}

/**
 * POST /api/chat/webhook - Handle web chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const { message, session_id, user_id, phone, email } = await request.json();
    
    if (!message || !session_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Detect intent and extract entities
    const nluResult = await detectIntent(message);
    
    console.log('Web chat NLU Result:', nluResult);

    let response: string;
    let order_id: string | undefined;

    if (nluResult.intent === 'order_status') {
      const result = await handleOrderStatusRequest(message, nluResult, phone, email);
      response = result.response;
      order_id = result.order_id;
    } else if (nluResult.intent === 'order_cancel') {
      response = await handleOrderCancelRequest();
    } else if (nluResult.intent === 'return_policy') {
      response = await handleReturnPolicyRequest();
    } else {
      response = "Salut! Sunt botul de suport FloristMarket. Pentru a te ajuta, îmi dai te rog ID-ul comenzii (ex: #1234) sau întreabă despre statusul comenzii.";
    }

    // Log the conversation
    await logChatMessage(session_id, message, 'user', order_id);
    await logChatMessage(session_id, response, 'bot', order_id);

    return NextResponse.json({
      response,
      order_id,
      intent: nluResult.intent,
      confidence: nluResult.confidence
    });

  } catch (error) {
    console.error('Web chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle order status request from web chat
 */
async function handleOrderStatusRequest(
  message: string, 
  nluResult: any, 
  phone?: string, 
  email?: string
): Promise<{ response: string; order_id?: string }> {
  try {
    let orderResult;

    // Try to find order by ID first
    if (nluResult.entities.order_id) {
      orderResult = await searchOrder(nluResult.entities.order_id);
    } else if (phone || email) {
      // Try to find by contact info
      orderResult = await searchOrder(undefined, email, phone);
    } else {
      // Ask for order ID
      return {
        response: WHATSAPP_TEMPLATES.ORDER_NOT_FOUND.toCustomer()
      };
    }

    if (!orderResult.found || !orderResult.order) {
      // Order not found, ask for contact info
      return {
        response: WHATSAPP_TEMPLATES.ORDER_NOT_FOUND.toCustomer(nluResult.entities.order_id)
      };
    }

    const order = orderResult.order;

    // Check if we have clear status and ETA
    if (order.eta_text) {
      // We have ETA, respond immediately
      const statusMessage = getOrderStatusMessage(order);
      return {
        response: statusMessage,
        order_id: order.id
      };
    } else {
      // No ETA, create ticket and ask seller
      let ticket = await findOpenTicket(order.id, 'order_eta');
      
      if (!ticket) {
        ticket = await createTicket(order.id, 'order_eta', order.seller.id);
      }

      if (ticket) {
        // Update ticket state
        await updateTicketState(ticket.id, 'waiting_seller', message);
        
        // Send message to seller via WhatsApp
        const sellerMessage = WHATSAPP_TEMPLATES.ORDER_ETA_REQUEST.toSeller(
          order.seller.name, 
          order.id
        );
        
        if (order.seller.whatsapp_business_number) {
          const sellerPhone = formatPhoneForWhatsApp(order.seller.whatsapp_business_number);
          await sendWhatsAppMessage(sellerPhone, sellerMessage);
        }

        // Confirm to customer
        const customerMessage = WHATSAPP_TEMPLATES.ORDER_ETA_REQUEST.toCustomer(order.id);
        return {
          response: customerMessage,
          order_id: order.id
        };
      }
    }

    return {
      response: "Ne pare rău, nu pot verifica statusul comenzii în acest moment. Te rugăm să încerci din nou."
    };

  } catch (error) {
    console.error('Error handling order status request:', error);
    return {
      response: "Ne pare rău, nu pot verifica statusul comenzii în acest moment. Te rugăm să încerci din nou."
    };
  }
}

/**
 * Handle order cancel request
 */
async function handleOrderCancelRequest(): Promise<string> {
  return "Pentru anularea comenzii, te rugăm să contactezi direct vânzătorul sau suportul nostru la +40 XXX XXX XXX.";
}

/**
 * Handle return policy request
 */
async function handleReturnPolicyRequest(): Promise<string> {
  return "Politica de retur: Ai 14 zile să returnezi produsele în condiții originale. Pentru detalii complete, vizitează https://floristmarket.ro/returns";
}

/**
 * Log chat message to database
 */
async function logChatMessage(
  sessionId: string, 
  message: string, 
  sender: 'user' | 'bot',
  orderId?: string
) {
  try {
    // For MVP, we'll just log to console
    // In production, you'd store this in a chat_sessions table
    console.log(`Chat Log [${sessionId}]:`, {
      sender,
      message,
      order_id: orderId,
      timestamp: new Date().toISOString()
    });
    
    // If you have a ticket, add the message to it
    if (orderId) {
      const ticket = await findOpenTicket(orderId, 'order_eta');
      if (ticket) {
        await addMessage(ticket.id, sender === 'user' ? 'customer' : 'bot', message, 'web');
      }
    }
    
  } catch (error) {
    console.error('Error logging chat message:', error);
  }
}

/**
 * GET /api/chat/session/{session_id} - Get chat session history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // For MVP, return mock data
    // In production, you'd fetch from chat_sessions table
    const mockSession: ChatSession = {
      session_id: sessionId,
      messages: [
        {
          id: '1',
          text: 'Salut! Cât mai durează comanda #1234?',
          sender: 'user',
          timestamp: new Date(Date.now() - 60000),
          order_id: '1234'
        },
        {
          id: '2',
          text: 'Întrebăm vânzătorul pentru ETA-ul comenzii #1234 și revenim imediat ce primim răspunsul.',
          sender: 'bot',
          timestamp: new Date(),
          order_id: '1234'
        }
      ]
    };

    return NextResponse.json(mockSession);

  } catch (error) {
    console.error('Error getting chat session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
