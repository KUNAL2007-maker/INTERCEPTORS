/**
 * Cryptographic Authentication & Token Engine (Native Node.js Crypto)
 * Enforces production-grade password hashing (PBKDF2) and signed JWT tokens (HMAC-SHA256)
 * Built for SIH 2026 / I4C Indian Cybercrime Reporting Platform
 */

import crypto from 'crypto';
import type { AppUser, RoleName, ClearanceLevel } from './rbac-abac';

const JWT_SECRET = process.env.JWT_SECRET || 'sih-2026-i4c-cryptotrace-jwt-hmac-sha256-secret-key-9988';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

export type JWTPayload = {
  id: number;
  uid: string;
  email: string;
  role: RoleName;
  name: string;
  jurisdiction_code: string | null;
  clearance_level: string;
  is_gazetted: boolean;
  vasp_id: number | null;
  iat: number;
  exp: number;
};

// ---------------------------------------------------------------------------
// 1. Base64URL Encoding Helpers
// ---------------------------------------------------------------------------
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

// ---------------------------------------------------------------------------
// 2. Salted Password Hashing & Verification (PBKDF2 - SHA512)
// ---------------------------------------------------------------------------
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. Cryptographic JWT Signing & Verification (HMAC-SHA256)
// ---------------------------------------------------------------------------
export function signJWT(user: AppUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JWTPayload = {
    id: user.id,
    uid: user.uid,
    email: user.email,
    role: user.role,
    name: user.name,
    jurisdiction_code: user.jurisdiction_code,
    clearance_level: user.clearance_level,
    is_gazetted: user.is_gazetted,
    vasp_id: user.vasp_id ?? null,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 4. Request Token Extractor (Extracts session from Cookie or Bearer Header)
// ---------------------------------------------------------------------------
export function extractTokenFromRequest(req: Request): string | null {
  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Check Cookie: auth_token=<token>
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export function extractUserClaims(req: Request): JWTPayload | null {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  return verifyJWT(token);
}
