import crypto from 'node:crypto';

function getRawKey(): Buffer {
  // Prefer base64 key (recommended)
  const keyB64 = process.env.KYC_DOCS_ENCRYPTION_KEY;
  if (keyB64) {
    let key: Buffer;
    try {
      key = Buffer.from(keyB64, 'base64');
    } catch {
      throw new Error('KYC_DOCS_ENCRYPTION_KEY must be base64');
    }
    if (key.length !== 32) {
      throw new Error('KYC_DOCS_ENCRYPTION_KEY must decode to 32 bytes (AES-256)');
    }
    return key;
  }

  // Backwards-compatible fallback (hex)
  const keyHex = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (keyHex) {
    let key: Buffer;
    try {
      key = Buffer.from(keyHex, 'hex');
    } catch {
      throw new Error('DOCUMENT_ENCRYPTION_KEY must be hex');
    }
    if (key.length !== 32) {
      throw new Error('DOCUMENT_ENCRYPTION_KEY must decode to 32 bytes (64 hex chars)');
    }
    return key;
  }

  throw new Error('Missing encryption key: set KYC_DOCS_ENCRYPTION_KEY (base64) or DOCUMENT_ENCRYPTION_KEY (hex)');
}

export function encryptKycDocument(plain: Buffer): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const key = getRawKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

export function decryptKycDocument(input: { ciphertext: Buffer; iv: Buffer; tag: Buffer }): Buffer {
  const key = getRawKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, input.iv);
  decipher.setAuthTag(input.tag);
  return Buffer.concat([decipher.update(input.ciphertext), decipher.final()]);
}
