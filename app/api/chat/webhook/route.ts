/**
 * Chat Webhook Handler
 * Handles messages from web chat interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatbotQueue, supportThreadMessages, supportThreads } from '@/db/schema/core';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { detectIntent } from '@/lib/nlu';
import { searchOrder, getOrderStatusMessage } from '@/lib/services/order-service';
import { createTicket, findOpenTicket, updateTicketState, addMessage } from '@/lib/services/ticket-service';
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import { formatPhoneForWhatsApp } from '@/lib/whatsapp';
import {
  getOutsideHoursNoticeRo,
  isWithinSupportHoursRo,
} from '@/lib/support/business-hours';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const { message, session_id, conversation_id, client_message_id, user_id, phone, email } = await request.json();
    
    if (!message || !session_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const withinSupportHours = isWithinSupportHoursRo();
    const conversationId: string =
      (typeof conversation_id === 'string' && UUID_RE.test(conversation_id)
        ? conversation_id
        : UUID_RE.test(session_id)
        ? session_id
        : crypto.randomUUID());

    const clientMessageId: string | null =
      typeof client_message_id === 'string' && UUID_RE.test(client_message_id)
        ? client_message_id
        : null;

    // Detect intent and extract entities (used both for bot responses and for tagging human handoff)
    const nluResult = await detectIntent(message);

    console.log('Web chat NLU Result:', nluResult);

    let response: string;
    let order_id: string | undefined;

    const now = new Date();
    const isUserIdUuid = typeof user_id === 'string' && UUID_RE.test(user_id);

    // Ensure a support thread exists for this webchat conversation.
    const [existingThread] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(and(eq(supportThreads.source, 'chatbot'), eq(supportThreads.sourceId, conversationId)))
      .limit(1);

    let threadId = existingThread?.id as string | undefined;
    if (!threadId) {
      const [newThread] = await db
        .insert(supportThreads)
        .values({
          source: 'chatbot',
          sourceId: conversationId,
          buyerId: isUserIdUuid ? user_id : null,
          status: 'open',
          priority: 'normal',
          subject: email ? `Webchat: ${email}` : 'Webchat: Vizitator',
          lastMessageAt: now,
          lastMessagePreview: String(message).slice(0, 200),
          messageCount: 0,
          updatedAt: now,
        })
        .returning({ id: supportThreads.id });
      threadId = newThread.id;
    }

    if (!threadId) {
      throw new Error('Failed to ensure support thread for webchat session');
    }

    // Store customer message in thread transcript (idempotent if client_message_id is provided)
    const customerInsert = clientMessageId
      ? db
          .insert(supportThreadMessages)
          .values({
            id: clientMessageId,
            threadId,
            authorId: isUserIdUuid ? user_id : null,
            authorRole: 'customer',
            body: String(message),
            createdAt: now,
          })
          .onConflictDoNothing({ target: supportThreadMessages.id })
      : db.insert(supportThreadMessages).values({
          threadId,
          authorId: isUserIdUuid ? user_id : null,
          authorRole: 'customer',
          body: String(message),
          createdAt: now,
        });

    const insertedCustomer = await customerInsert.returning({ id: supportThreadMessages.id });
    const didInsertCustomer = Boolean(insertedCustomer?.[0]?.id);

    // Update thread counters/preview (only if this message is new)
    if (didInsertCustomer) {
      await db
        .update(supportThreads)
        .set({
          lastMessageAt: now,
          lastMessagePreview: String(message).slice(0, 200),
          messageCount: sql`${supportThreads.messageCount} + 1`,
          updatedAt: now,
        })
        .where(eq(supportThreads.id, threadId));
    }

    // In program: route to human support (no chatbot reply logic).
    if (withinSupportHours) {
      // Create or update a single active queue item per conversation (avoid spamming queue).
      const [existingQueue] = await db
        .select({ id: chatbotQueue.id })
        .from(chatbotQueue)
        .where(and(
          eq(chatbotQueue.conversationId, conversationId),
          inArray(chatbotQueue.status, ['pending', 'processing'])
        ))
        .orderBy(desc(chatbotQueue.updatedAt))
        .limit(1);

      const confidenceStr = typeof nluResult?.confidence === 'number' ? String(nluResult.confidence) : null;

      if (existingQueue?.id) {
        await db
          .update(chatbotQueue)
          .set({
            threadId,
            userId: isUserIdUuid ? user_id : null,
            status: 'pending',
            intent: nluResult?.intent || null,
            confidence: confidenceStr,
            userQuery: message,
            lastBotResponse: null,
            handoffReason: 'business_hours_human_available',
            updatedAt: now,
          })
          .where(eq(chatbotQueue.id, existingQueue.id));
      } else {
        await db
          .insert(chatbotQueue)
          .values({
            threadId,
            conversationId,
            userId: isUserIdUuid ? user_id : null,
            status: 'pending',
            intent: nluResult?.intent || null,
            confidence: confidenceStr,
            userQuery: message,
            lastBotResponse: null,
            handoffReason: 'business_hours_human_available',
            promptInjectionSuspected: false,
            updatedAt: now,
          });
      }

      return NextResponse.json({
        accepted: true,
        intent: nluResult.intent,
        confidence: nluResult.confidence,
        mode: 'human',
        conversation_id: conversationId,
      });
    }

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

    // Store bot response in thread transcript
    const botNow = new Date();
    const [botMsg] = await db
      .insert(supportThreadMessages)
      .values({
        threadId,
        authorId: null,
        authorRole: 'bot',
        body: response,
        createdAt: botNow,
      })
      .returning({ id: supportThreadMessages.id });

    await db
      .update(supportThreads)
      .set({
        lastMessageAt: botNow,
        lastMessagePreview: response.slice(0, 200),
        messageCount: sql`${supportThreads.messageCount} + 1`,
        updatedAt: botNow,
      })
      .where(eq(supportThreads.id, threadId));

    return NextResponse.json({
      response,
      order_id,
      intent: nluResult.intent,
      confidence: nluResult.confidence,
      mode: 'bot',
      notice: getOutsideHoursNoticeRo(),
      conversation_id: conversationId,
      bot_message_id: botMsg?.id ?? null,
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
