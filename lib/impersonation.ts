import { cookies } from 'next/headers';
import type { JWTPayload } from 'jose';
import { SignJWT, jwtVerify } from 'jose';

export const IMPERSONATION_COOKIE_NAME = 'fm_impersonation';

export interface ImpersonationSession extends JWTPayload {
  sellerId: string;
  adminUserId: string;
  mode: 'seller_readonly';
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
);

export async function createImpersonationToken(input: {
  sellerId: string;
  adminUserId: string;
  ttlSeconds: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.max(60, input.ttlSeconds);

  return new SignJWT({
    sellerId: input.sellerId,
    adminUserId: input.adminUserId,
    mode: 'seller_readonly',
  } satisfies Omit<ImpersonationSession, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

export async function verifyImpersonationToken(token: string): Promise<ImpersonationSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || typeof payload !== 'object') return null;

    const sellerId = (payload as any).sellerId;
    const adminUserId = (payload as any).adminUserId;
    const mode = (payload as any).mode;

    if (typeof sellerId !== 'string' || typeof adminUserId !== 'string') return null;
    if (mode !== 'seller_readonly') return null;

    return payload as unknown as ImpersonationSession;
  } catch {
    return null;
  }
}

export async function getImpersonationFromCookies(): Promise<ImpersonationSession | null> {
  const token = cookies().get(IMPERSONATION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyImpersonationToken(token);
}

export async function isImpersonatingAdmin(currentUserId: string): Promise<boolean> {
  const imp = await getImpersonationFromCookies();
  return !!imp && imp.adminUserId === currentUserId;
}
