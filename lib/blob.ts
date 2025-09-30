import { put } from "@vercel/blob";

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

export function constructSellerPath(sellerId: string, filename: string): string {
  // Ensure filename is safe
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `seller-${sellerId}/${safeFilename}`;
}

export function validateSellerPath(pathname: string, sellerId: string): boolean {
  const expectedPrefix = `seller-${sellerId}/`;
  return pathname.startsWith(expectedPrefix);
}

export function validateMimeType(contentType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(contentType);
}

export async function uploadToBlob(pathname: string, file: File): Promise<{ url: string }> {
  const blob = await put(pathname, file, {
    access: 'public',
  });
  
  return { url: blob.url };
}

