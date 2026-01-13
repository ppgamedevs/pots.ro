/**
 * WhatsApp Cloud API Integration
 * Handles sending messages via Meta WhatsApp Business API
 */

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body';
      parameters: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * WhatsApp Cloud API configuration
 */
const WHATSAPP_CONFIG = {
  apiUrl: 'https://graph.facebook.com/v18.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
};

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!WHATSAPP_CONFIG.phoneNumberId || !WHATSAPP_CONFIG.accessToken) {
      throw new Error('WhatsApp configuration missing');
    }

    const payload: WhatsAppMessage = {
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      console.error('WhatsApp API error:', error);
      return {
        success: false,
        error: error.error.message
      };
    }

    const result = data as WhatsAppResponse;
    return {
      success: true,
      messageId: result.messages[0]?.id
    };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a template message via WhatsApp
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[] = [],
  languageCode: string = 'ro'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!WHATSAPP_CONFIG.phoneNumberId || !WHATSAPP_CONFIG.accessToken) {
      throw new Error('WhatsApp configuration missing');
    }

    const payload: WhatsAppMessage = {
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };

    // Add parameters if provided
    if (parameters.length > 0) {
      payload.template!.components = [{
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param
        }))
      }];
    }

    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      console.error('WhatsApp template API error:', error);
      return {
        success: false,
        error: error.error.message
      };
    }

    const result = data as WhatsAppResponse;
    return {
      success: true,
      messageId: result.messages[0]?.id
    };

  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify WhatsApp webhook
 */
export function verifyWhatsAppWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.webhookVerifyToken) {
    return challenge;
  }
  return null;
}

/**
 * Parse incoming WhatsApp message
 */
export interface IncomingWhatsAppMessage {
  from: string;
  messageId: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'system';
  text?: {
    body: string;
  };
  context?: {
    from: string;
    id: string;
  };
}

export function parseIncomingWhatsAppMessage(body: any): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = [];

  try {
    if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
      const webhookMessages = body.entry[0].changes[0].value.messages;
      
      for (const message of webhookMessages) {
        messages.push({
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text,
          context: message.context
        });
      }
    }
  } catch (error) {
    console.error('Error parsing WhatsApp message:', error);
  }

  return messages;
}

/**
 * Check if phone number is valid for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Romanian phone numbers: +40, 0040, or 07
  const romanianPattern = /^(\+40|0040|0)[0-9]{9}$/;
  
  return romanianPattern.test(cleanPhone);
}

/**
 * Format phone number for WhatsApp API
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Convert to international format
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '40' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('0040')) {
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('+40')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  return cleanPhone;
}

/**
 * Template messages for different scenarios
 */
export const WHATSAPP_TEMPLATES = {
  ORDER_ETA_REQUEST: {
    name: 'order_eta_request',
    toSeller: (sellerName: string, orderId: string) => 
      `Salut ${sellerName}, clientul întreabă ETA pentru comanda #${orderId}. Te rugăm răspunde aici (ex: "azi până la 18:00" sau "mâine 14-18").`,
    
    toCustomer: (orderId: string) => 
      `Întrebăm vânzătorul pentru ETA-ul comenzii #${orderId} și revenim imediat ce primim răspunsul.`
  },

  ORDER_UPDATE: {
    name: 'order_update',
    toCustomer: (orderId: string, eta: string) => 
      `Actualizare comandă #${orderId}: livrare estimată ${eta}. Mulțumim că ai ales FloristMarket!`
  },

  ORDER_NOT_FOUND: {
    toCustomer: (orderId?: string) => 
      orderId 
        ? `Nu găsesc comanda #${orderId}. Îmi dai, te rog, emailul sau numărul de telefon folosit la comandă?`
        : `Pentru a verifica statusul comenzii, îmi dai te rog ID-ul comenzii (ex: #1234)?`
  },

  SELLER_REMINDER: {
    name: 'seller_reminder',
    toSeller: (sellerName: string, orderId: string) => 
      `Reminder: Clientul încă așteaptă ETA pentru comanda #${orderId}. Poți răspunde aici cu estimarea de livrare?`
  },

  ESCALATION: {
    name: 'escalation',
    toSupport: (orderId: string, sellerName: string) => 
      `ESCALATION: Vânzătorul ${sellerName} nu a răspuns la cererea de ETA pentru comanda #${orderId} în 6 ore.`
  }
};

/**
 * Rate limiting for WhatsApp messages
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(phone: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = phone;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}
