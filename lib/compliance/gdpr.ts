import crypto from 'crypto';

import { normalizeEmail } from '@/lib/auth/crypto';

export function getEmailDomain(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).toLowerCase().trim();
}

export function hashEmailSha256(email: string): string {
  const normalized = normalizeEmail(email);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
