export interface MaskContactResult {
  maskedBody: string;
  warning: boolean;
  redactedCount: number;
}

/**
 * Mask contact information in text to prevent direct communication
 * Replaces emails and phone numbers with [redacted]
 * 
 * @param body Original text body
 * @returns Object with masked text and warning flag
 */
export function maskContact(body: string): MaskContactResult {
  let maskedBody = body;
  let redactedCount = 0;
  
  // Email regex pattern
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  
  // Phone regex pattern - matches various phone number formats
  const phoneRegex = /(\+?\d[\s\-()]?){7,}/g;
  
  // Replace emails
  const emailMatches = maskedBody.match(emailRegex);
  if (emailMatches) {
    redactedCount += emailMatches.length;
    maskedBody = maskedBody.replace(emailRegex, '[redacted]');
  }
  
  // Replace phone numbers
  const phoneMatches = maskedBody.match(phoneRegex);
  if (phoneMatches) {
    redactedCount += phoneMatches.length;
    maskedBody = maskedBody.replace(phoneRegex, '[redacted]');
  }
  
  return {
    maskedBody,
    warning: redactedCount > 0,
    redactedCount,
  };
}

/**
 * Check if text contains contact information without masking it
 * @param body Text to check
 * @returns true if contact info is detected
 */
export function hasContactInfo(body: string): boolean {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(\+?\d[\s\-()]?){7,}/g;
  
  return emailRegex.test(body) || phoneRegex.test(body);
}

/**
 * Get count of contact information instances in text
 * @param body Text to analyze
 * @returns Object with counts of emails and phones
 */
export function getContactInfoCount(body: string): { emails: number; phones: number } {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(\+?\d[\s\-()]?){7,}/g;
  
  const emailMatches = body.match(emailRegex);
  const phoneMatches = body.match(phoneRegex);
  
  return {
    emails: emailMatches ? emailMatches.length : 0,
    phones: phoneMatches ? phoneMatches.length : 0,
  };
}

/**
 * Validate message content for messaging system
 * Applies contact masking and returns validation result
 * @param body Original message body
 * @returns Validation result with masked content and warnings
 */
export function validateMessageContent(body: string): MaskContactResult {
  if (!body || body.trim().length === 0) {
    throw new Error('Message body cannot be empty');
  }
  
  if (body.length > 10000) {
    throw new Error('Message body too long (max 10000 characters)');
  }
  
  return maskContact(body);
}
