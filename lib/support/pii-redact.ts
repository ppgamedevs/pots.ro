/**
 * PII redaction for support message moderation.
 * Used by POST /moderate (action=redact) and POST /redact.
 */

export type PIIPattern = "email" | "phone" | "iban" | "cnp" | "cui" | "card";

const PII_PATTERNS: { key: PIIPattern; regex: RegExp; replace: string }[] = [
  { key: "phone", regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/g, replace: "[PHONE]" },
  { key: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replace: "[EMAIL]" },
  { key: "iban", regex: /[A-Z]{2}\d{2}[A-Z0-9]{4,30}/gi, replace: "[IBAN]" },
  { key: "card", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replace: "[CARD]" },
  { key: "cnp", regex: /\b[1-8]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{6}\b/g, replace: "[CNP]" },
  { key: "cui", regex: /\b(RO)?\d{2,10}\b/gi, replace: "[CUI]" },
];

const PATTERNS_BY_KEY = new Map(PII_PATTERNS.map((p) => [p.key, p]));

/** Redact PII in text. Use "all" or omit to apply all patterns. */
export function redactPII(
  text: string,
  options?: { patterns?: ("email" | "phone" | "iban" | "cnp" | "all")[] }
): string {
  const use = options?.patterns?.length
    ? options.patterns.includes("all")
      ? PII_PATTERNS
      : (options.patterns as PIIPattern[]).map((k) => PATTERNS_BY_KEY.get(k)).filter(Boolean) as typeof PII_PATTERNS
    : PII_PATTERNS;
  let result = text;
  for (const p of use) {
    result = result.replace(p.regex, p.replace);
  }
  return result;
}

/** One-click "redact all PII" – same as redactPII(text). */
export function autoRedactPII(text: string): string {
  return redactPII(text);
}
