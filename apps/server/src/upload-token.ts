// ============================================================
// Upload Token - Stateless HMAC-signed upload session tokens
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_SECRET = process.env.UPLOAD_TOKEN_SECRET || 'dev-secret-change-in-production';
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface UploadSession {
  key: string;
  uploadId: string;
  fileSize: number;
  partSize: number;
  fileName: string;
  exp: number; // expiry timestamp in ms
}

/**
 * Sign upload session data with HMAC
 */
function signPayload(payload: string): string {
  const hmac = createHmac('sha256', TOKEN_SECRET);
  hmac.update(payload);
  return hmac.digest('base64url');
}

/**
 * Create a signed upload token
 */
export function createUploadToken(session: Omit<UploadSession, 'exp'>): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const sessionWithExp: UploadSession = { ...session, exp };
  
  const payload = JSON.stringify(sessionWithExp);
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const signature = signPayload(payloadB64);
  
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode an upload token
 * Throws if invalid or expired
 */
export function verifyUploadToken(token: string): UploadSession {
  // Split token into payload and signature
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }

  const [payloadB64, signature] = parts;

  // Verify signature
  const expectedSignature = signPayload(payloadB64);
  
  // Use timing-safe comparison
  const signatureBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64url');
  
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  // Decode payload
  let session: UploadSession;
  try {
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    session = JSON.parse(payload);
  } catch (error) {
    throw new Error('Invalid token payload');
  }

  // Check expiry
  if (Date.now() > session.exp) {
    throw new Error('Token expired');
  }

  // Validate required fields
  if (!session.key || !session.uploadId || !session.fileSize || !session.partSize || !session.fileName) {
    throw new Error('Token missing required fields');
  }

  return session;
}
