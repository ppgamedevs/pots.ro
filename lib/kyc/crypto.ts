import crypto from 'node:crypto';

function getRawKey(): Buffer {
  const keyB64 = process.env.KYC_DOCS_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error('KYC_DOCS_ENCRYPTION_KEY is not set');
  }

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
