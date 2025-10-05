/**
 * WhatsApp Webhook Handler
 * Handles incoming messages from customers and sellers
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppWebhook, parseIncomingWhatsAppMessage, formatPhoneForWhatsApp } from '@/lib/whatsapp';
import { detectIntent } from '@/lib/nlu';
import { searchOrder, updateOrderETA, getOrderStatusMessage } from '@/lib/services/order-service';
import { createTicket, findOpenTicket, updateTicketState, addMessage, findTicketBySellerContext } from '@/lib/services/ticket-service';
import { parseRomanianETA, validateETA } from '@/lib/nlu';
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';

/**
 * GET /api/whatsapp/webhook - Webhook verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!mode || !token || !challenge) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const verificationResult = verifyWhatsAppWebhook(mode, token, challenge);
  
  if (verificationResult) {
    return new NextResponse(verificationResult);
  } else {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

/**
 * POST /api/whatsapp/webhook - Handle incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    const messages = parseIncomingWhatsAppMessage(body);
    
    if (messages.length === 0) {
      return NextResponse.json({ status: 'ok' });
    }

    // Process each message
    for (const message of messages) {
      await processWhatsAppMessage(message);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process individual WhatsApp message
 */
async function processWhatsAppMessage(message: any) {
  try {
    const phone = formatPhoneForWhatsApp(message.from);
    
    // Check if this is a seller responding to a ticket
    const sellerTicket = await findTicketBySellerContext(phone);
    
    if (sellerTicket && message.text?.body) {
      await handleSellerResponse(sellerTicket, message.text.body, phone);
      return;
    }

    // Otherwise, treat as customer message
    if (message.type === 'text' && message.text?.body) {
      await handleCustomerMessage(phone, message.text.body);
    }

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

/**
 * Handle customer message
 */
async function handleCustomerMessage(phone: string, messageText: string) {
  try {
    // Detect intent and extract entities
    const nluResult = await detectIntent(messageText);
    
    console.log('NLU Result:', nluResult);

    if (nluResult.intent === 'order_status') {
      await handleOrderStatusRequest(phone, nluResult, messageText);
    } else if (nluResult.intent === 'order_cancel') {
      await handleOrderCancelRequest(phone, nluResult, messageText);
    } else if (nluResult.intent === 'return_policy') {
      await handleReturnPolicyRequest(phone);
    } else {
      await sendWhatsAppMessage(phone, 
        "Salut! Sunt botul de suport FloristMarket. Pentru a te ajuta, îmi dai te rog ID-ul comenzii (ex: #1234) sau întreabă despre statusul comenzii."
      );
    }

  } catch (error) {
    console.error('Error handling customer message:', error);
    await sendWhatsAppMessage(phone, 
      "Ne pare rău, a apărut o problemă tehnică. Te rugăm să încerci din nou sau să contactezi suportul."
    );
  }
}

/**
 * Handle order status request
 */
async function handleOrderStatusRequest(phone: string, nluResult: any, originalMessage: string) {
  try {
    let orderResult;

    // Try to find order by ID first
    if (nluResult.entities.order_id) {
      orderResult = await searchOrder(nluResult.entities.order_id);
    } else {
      // Ask for order ID
      await sendWhatsAppMessage(phone, WHATSAPP_TEMPLATES.ORDER_NOT_FOUND.toCustomer());
      return;
    }

    if (!orderResult.found || !orderResult.order) {
      // Order not found, ask for contact info
      await sendWhatsAppMessage(phone, WHATSAPP_TEMPLATES.ORDER_NOT_FOUND.toCustomer(nluResult.entities.order_id));
      return;
    }

    const order = orderResult.order;

    // Check if we have clear status and ETA
    if (order.eta_text) {
      // We have ETA, respond immediately
      const statusMessage = getOrderStatusMessage(order);
      await sendWhatsAppMessage(phone, statusMessage);
      
      // Log the interaction
      await addMessage('', 'customer', originalMessage, 'whatsapp');
      await addMessage('', 'bot', statusMessage, 'whatsapp');
      
    } else {
      // No ETA, create ticket and ask seller
      let ticket = await findOpenTicket(order.id, 'order_eta');
      
      if (!ticket) {
        ticket = await createTicket(order.id, 'order_eta', order.seller.id);
      }

      if (ticket) {
        // Update ticket state
        await updateTicketState(ticket.id, 'waiting_seller', originalMessage);
        
        // Send message to seller
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
        await sendWhatsAppMessage(phone, customerMessage);

        // Log messages
        await addMessage(ticket.id, 'customer', originalMessage, 'whatsapp');
        await addMessage(ticket.id, 'bot', customerMessage, 'whatsapp');
        await addMessage(ticket.id, 'bot', sellerMessage, 'whatsapp');
      }
    }

  } catch (error) {
    console.error('Error handling order status request:', error);
    await sendWhatsAppMessage(phone, 
      "Ne pare rău, nu pot verifica statusul comenzii în acest moment. Te rugăm să încerci din nou."
    );
  }
}

/**
 * Handle seller response
 */
async function handleSellerResponse(ticket: any, messageText: string, sellerPhone: string) {
  try {
    // Parse ETA from seller message
    const eta = parseRomanianETA(messageText);
    
    if (!eta || !validateETA(eta)) {
      // Invalid ETA format, ask for clarification
      await sendWhatsAppMessage(sellerPhone, 
        "Formatul nu este recunoscut. Te rugăm să răspunzi cu: 'azi până la HH:MM' / 'mâine HH–HH' / '3–5 zile'"
      );
      return;
    }

    // Update order with ETA
    const success = await updateOrderETA(ticket.order_id, eta);
    
    if (success) {
      // Update ticket state
      await updateTicketState(ticket.id, 'answered', messageText);
      
      // Get order details to notify customer
      const orderResult = await searchOrder(ticket.order_id);
      
      if (orderResult.found && orderResult.order) {
        const order = orderResult.order;
        
        // Notify customer if they have WhatsApp opt-in
        if (order.buyer.whatsapp_opt_in && order.buyer.phone) {
          const customerPhone = formatPhoneForWhatsApp(order.buyer.phone);
          const updateMessage = WHATSAPP_TEMPLATES.ORDER_UPDATE.toCustomer(order.id, eta);
          await sendWhatsAppMessage(customerPhone, updateMessage);
        }
      }

      // Confirm to seller
      await sendWhatsAppMessage(sellerPhone, 
        `Mulțumesc! Am notificat clientul cu ETA-ul: ${eta}`
      );

      // Log messages
      await addMessage(ticket.id, 'seller', messageText, 'whatsapp');
      await addMessage(ticket.id, 'bot', `ETA actualizat: ${eta}`, 'whatsapp');
      
      // Close ticket
      await updateTicketState(ticket.id, 'closed');
      
    } else {
      await sendWhatsAppMessage(sellerPhone, 
        "Ne pare rău, nu am putut actualiza ETA-ul. Te rugăm să încerci din nou."
      );
    }

  } catch (error) {
    console.error('Error handling seller response:', error);
    await sendWhatsAppMessage(sellerPhone, 
      "Ne pare rău, a apărut o problemă tehnică. Te rugăm să încerci din nou."
    );
  }
}

/**
 * Handle order cancel request
 */
async function handleOrderCancelRequest(phone: string, nluResult: any, originalMessage: string) {
  // For MVP, just acknowledge and provide contact info
  await sendWhatsAppMessage(phone, 
    "Pentru anularea comenzii, te rugăm să contactezi direct vânzătorul sau suportul nostru la +40 XXX XXX XXX."
  );
}

/**
 * Handle return policy request
 */
async function handleReturnPolicyRequest(phone: string) {
  await sendWhatsAppMessage(phone, 
    "Politica de retur: Ai 14 zile să returnezi produsele în condiții originale. Pentru detalii complete, vizitează https://pots.ro/returns"
  );
}
