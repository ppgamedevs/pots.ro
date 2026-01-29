const MAX_FILENAME_CHARS = 180;
const MIN_BYTES = 16;

export const KYC_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export type KycAllowedMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

function hasPdfMagic(buf: Buffer): boolean {
  // %PDF-
  return buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

function hasPngMagic(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function hasJpegMagic(buf: Buffer): boolean {
  // FF D8 FF
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function hasWebpMagic(buf: Buffer): boolean {
  // RIFF....WEBP
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

function looksLikeWindowsExe(buf: Buffer): boolean {
  // MZ
  return buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a;
}

function looksLikeZip(buf: Buffer): boolean {
  // PK\x03\x04 etc
  return buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function detectKycMimeFromMagic(buf: Buffer): KycAllowedMime | null {
  if (hasPdfMagic(buf)) return 'application/pdf';
  if (hasPngMagic(buf)) return 'image/png';
  if (hasJpegMagic(buf)) return 'image/jpeg';
  if (hasWebpMagic(buf)) return 'image/webp';
  return null;
}

function extForMime(mime: KycAllowedMime): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
  }
}

export function sanitizeUploadFilename(original: string, mime: KycAllowedMime): string {
  const forcedExt = extForMime(mime);

  // Strip any path components and null bytes
  const base = (original || 'document')
    .replace(/\0/g, '')
    .split(/[/\\]/)
    .pop() || 'document';

  // Replace control chars and risky characters; keep a conservative set
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^a-zA-Z0-9._\- ()]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  const truncated = cleaned.length > 0 ? cleaned.slice(0, MAX_FILENAME_CHARS) : 'document';

  // Remove existing extension(s) to avoid "file.pdf.exe" tricks.
  const withoutExt = truncated.replace(/(\.[a-zA-Z0-9]{1,10})+$/, '');
  const safeBase = withoutExt.length > 0 ? withoutExt : 'document';

  return `${safeBase}.${forcedExt}`;
}

export async function validateKycUploadFile(
  file: File,
  options?: { allowWebp?: boolean }
): Promise<{
  buffer: Buffer;
  mimeType: KycAllowedMime;
  safeFilename: string;
  sizeBytes: number;
}> {
  if (!(file instanceof File)) {
    throw new Error('INVALID_FILE');
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error('EMPTY_FILE');
  }

  if (file.size < MIN_BYTES) {
    throw new Error('FILE_TOO_SMALL');
  }

  if (file.size > KYC_MAX_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  // file.type comes from the client and can be spoofed; we verify by magic bytes.
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length !== file.size) {
    // Defensive: reject if the declared size doesn't match what we read.
    throw new Error('SIZE_MISMATCH');
  }

  if (looksLikeWindowsExe(buffer) || looksLikeZip(buffer)) {
    throw new Error('DISALLOWED_BINARY');
  }

  const detected = detectKycMimeFromMagic(buffer);
  const allowed = new Set<KycAllowedMime>(['application/pdf', 'image/jpeg', 'image/png']);
  if (options?.allowWebp) allowed.add('image/webp');
  if (!detected || !allowed.has(detected)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  const safeFilename = sanitizeUploadFilename(file.name, detected);

  return {
    buffer,
    mimeType: detected,
    safeFilename,
    sizeBytes: buffer.length,
  };
}
