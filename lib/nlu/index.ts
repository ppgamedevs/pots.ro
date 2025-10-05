/**
 * Natural Language Understanding Service
 * Detects user intents and extracts entities from messages
 */

export interface NLUResult {
  intent: 'order_status' | 'order_cancel' | 'return_policy' | 'unknown';
  order_id?: string;
  confidence: number;
  entities: {
    order_id?: string;
    email?: string;
    phone?: string;
  };
}

export interface NLUExample {
  text: string;
  intent: string;
  entities: Record<string, string>;
}

// Few-shot examples for intent classification
const EXAMPLES: NLUExample[] = [
  {
    text: "Cât mai durează comanda #1234?",
    intent: "order_status",
    entities: { order_id: "1234" }
  },
  {
    text: "Status comanda 5678",
    intent: "order_status", 
    entities: { order_id: "5678" }
  },
  {
    text: "Unde e comanda mea?",
    intent: "order_status",
    entities: {}
  },
  {
    text: "Când vine comanda #9999?",
    intent: "order_status",
    entities: { order_id: "9999" }
  },
  {
    text: "Vreau să anulez comanda #1234",
    intent: "order_cancel",
    entities: { order_id: "1234" }
  },
  {
    text: "Care e politica de retur?",
    intent: "return_policy",
    entities: {}
  },
  {
    text: "Bună ziua",
    intent: "unknown",
    entities: {}
  },
  {
    text: "Mulțumesc pentru ajutor",
    intent: "unknown",
    entities: {}
  }
];

/**
 * Extract order ID from text using regex patterns
 */
function extractOrderId(text: string): string | null {
  // Patterns: #1234, 1234, comanda 1234, order 1234
  const patterns = [
    /#?(\d{3,6})/g,
    /comanda\s+#?(\d{3,6})/gi,
    /order\s+#?(\d{3,6})/gi,
    /comanda\s+(\d{3,6})/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].replace(/[#\s]/g, '');
    }
  }

  return null;
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | null {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const match = text.match(emailPattern);
  return match ? match[0] : null;
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | null {
  // Romanian phone patterns: +40, 07, 0040
  const phonePattern = /(\+40|0040|0)[0-9]{9}/g;
  const match = text.match(phonePattern);
  return match ? match[0] : null;
}

/**
 * Simple rule-based intent detection (fallback)
 */
function detectIntentRules(text: string): NLUResult {
  const lowerText = text.toLowerCase();
  
  // Order status keywords
  const statusKeywords = [
    'status', 'comanda', 'unde', 'când', 'durează', 'vine', 'livrare', 'tracking'
  ];
  
  // Cancel keywords  
  const cancelKeywords = [
    'anulez', 'anulare', 'cancel', 'renunț', 'nu mai vreau'
  ];
  
  // Return keywords
  const returnKeywords = [
    'retur', 'return', 'restitui', 'bani înapoi', 'garantie'
  ];

  let intent: NLUResult['intent'] = 'unknown';
  let confidence = 0.5;

  if (statusKeywords.some(keyword => lowerText.includes(keyword))) {
    intent = 'order_status';
    confidence = 0.8;
  } else if (cancelKeywords.some(keyword => lowerText.includes(keyword))) {
    intent = 'order_cancel';
    confidence = 0.8;
  } else if (returnKeywords.some(keyword => lowerText.includes(keyword))) {
    intent = 'return_policy';
    confidence = 0.8;
  }

  return {
    intent,
    confidence,
    entities: {
      order_id: extractOrderId(text) || undefined,
      email: extractEmail(text) || undefined,
      phone: extractPhone(text) || undefined
    }
  };
}

/**
 * LLM-based intent detection using OpenAI GPT-4o-mini
 */
async function detectIntentLLM(text: string): Promise<NLUResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an NLU system for a Romanian e-commerce chatbot. 
            Classify user messages into intents and extract entities.
            
            Intents:
            - order_status: questions about order status, delivery time, tracking
            - order_cancel: requests to cancel an order
            - return_policy: questions about returns, refunds, warranty
            - unknown: greetings, thanks, unrelated messages
            
            Entities to extract:
            - order_id: order numbers (3-6 digits, with or without #)
            - email: email addresses
            - phone: Romanian phone numbers
            
            Examples:
            ${EXAMPLES.map(ex => 
              `Text: "${ex.text}"\nIntent: ${ex.intent}\nEntities: ${JSON.stringify(ex.entities)}`
            ).join('\n')}
            
            Return ONLY a JSON object with this exact structure:
            {
              "intent": "order_status|order_cancel|return_policy|unknown",
              "order_id": "1234" or null,
              "confidence": 0.95,
              "entities": {
                "order_id": "1234" or null,
                "email": "user@example.com" or null,
                "phone": "+40712345678" or null
              }
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse JSON response
    const result = JSON.parse(content);
    
    // Validate and normalize result
    return {
      intent: result.intent || 'unknown',
      order_id: result.order_id || undefined,
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      entities: {
        order_id: result.entities?.order_id || undefined,
        email: result.entities?.email || undefined,
        phone: result.entities?.phone || undefined
      }
    };

  } catch (error) {
    console.error('LLM intent detection failed:', error);
    // Fallback to rule-based detection
    return detectIntentRules(text);
  }
}

/**
 * Main NLU function - hybrid approach
 */
export async function detectIntent(text: string): Promise<NLUResult> {
  // First try rule-based detection for simple cases
  const ruleResult = detectIntentRules(text);
  
  // If we have high confidence and extracted entities, use it
  if (ruleResult.confidence > 0.8 && ruleResult.entities.order_id) {
    return ruleResult;
  }
  
  // For complex cases or when rules fail, use LLM
  try {
    const llmResult = await detectIntentLLM(text);
    
    // Combine results - prefer LLM but fallback to rules
    if (llmResult.confidence > ruleResult.confidence) {
      return llmResult;
    } else {
      return ruleResult;
    }
  } catch (error) {
    console.error('NLU error:', error);
    return ruleResult;
  }
}

/**
 * Parse Romanian ETA text into normalized format
 */
export function parseRomanianETA(text: string): string | null {
  const lowerText = text.toLowerCase().trim();
  
  // Today patterns
  if (lowerText.includes('azi')) {
    if (lowerText.includes('până la') || lowerText.includes('pana la')) {
      const timeMatch = lowerText.match(/(\d{1,2}):?(\d{0,2})/);
      if (timeMatch) {
        const hour = timeMatch[1];
        const minute = timeMatch[2] || '00';
        return `azi până la ${hour}:${minute}`;
      }
    }
    return 'azi';
  }
  
  // Tomorrow patterns
  if (lowerText.includes('mâine') || lowerText.includes('main')) {
    if (lowerText.includes('după') || lowerText.includes('dupa')) {
      const timeMatch = lowerText.match(/(\d{1,2})/);
      if (timeMatch) {
        return `mâine după ${timeMatch[1]}:00`;
      }
    }
    if (lowerText.includes('între') || lowerText.includes('intre')) {
      const timeMatch = lowerText.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
      if (timeMatch) {
        return `mâine ${timeMatch[1]}:00–${timeMatch[2]}:00`;
      }
    }
    return 'mâine';
  }
  
  // Day patterns
  const dayMatch = lowerText.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*zile/);
  if (dayMatch) {
    return `${dayMatch[1]}-${dayMatch[2]} zile`;
  }
  
  // Specific time patterns
  const timeMatch = lowerText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  
  // If no pattern matches, return the original text
  return text.length > 0 ? text : null;
}

/**
 * Validate if a parsed ETA makes sense
 */
export function validateETA(eta: string): boolean {
  if (!eta || eta.length < 2) return false;
  
  // Check for reasonable time formats
  const validPatterns = [
    /azi/,
    /mâine/,
    /main/,
    /\d{1,2}:\d{2}/,
    /\d{1,2}-\d{1,2}\s*zile/,
    /până la/,
    /pana la/
  ];
  
  return validPatterns.some(pattern => pattern.test(eta.toLowerCase()));
}
