import type { JWTPayload } from 'jose';
import { SignJWT, jwtVerify } from 'jose';

export interface DsarVerifyTokenPayload extends JWTPayload {
  kind: 'dsar_verify';
  requestId: string;
  emailHash: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    'fallback-secret-key-that-is-long-enough-for-security-purposes-minimum-32-chars'
);

export async function createDsarVerifyToken(input: {
  requestId: string;
  emailHash: string;
  ttlSeconds: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.max(60, input.ttlSeconds);

  return new SignJWT({
    kind: 'dsar_verify',
    requestId: input.requestId,
    emailHash: input.emailHash,
  } satisfies Omit<DsarVerifyTokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

export async function verifyDsarVerifyToken(token: string): Promise<DsarVerifyTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || typeof payload !== 'object') return null;

    const kind = (payload as any).kind;
    const requestId = (payload as any).requestId;
    const emailHash = (payload as any).emailHash;

    if (kind !== 'dsar_verify') return null;
    if (typeof requestId !== 'string' || typeof emailHash !== 'string') return null;

    return payload as unknown as DsarVerifyTokenPayload;
  } catch {
    return null;
  }
}
