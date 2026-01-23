export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return '***';

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  const first = local.slice(0, 1);
  const last = local.slice(-1);
  const maskedLocal = `${first}${'*'.repeat(Math.max(1, local.length - 2))}${last}`;

  // Keep domain readable for ops (non-PII requirement is email/phone/address; domain is useful)
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function maskAddress(address: string): string {
  if (!address) return '';
  const trimmed = address.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`;
}
