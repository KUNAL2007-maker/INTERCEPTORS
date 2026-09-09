/**
 * Cryptographic Authentication & Token Engine (Native Node.js Crypto)
 * Enforces production-grade password hashing (PBKDF2) and dual-mode token verification:
 * 1. Keycloak Enterprise OIDC tokens (RS256 with ABAC claim mapping)
 * 2. High-security local fallback tokens (HMAC-SHA256 with JWT_SECRET)
 * Built for SIH 2026 / I4C Indian Cybercrime Reporting Platform
 */

import crypto from 'crypto';
import {
  type AppUser,
  type RoleName,
  normalizeRole,
  SYSTEM_PERSONAS
} from './rbac-abac';
import {
  resolveRoleFromKeycloak,
  fetchKeycloakJWKS,
  verifyKeycloakSignatureSync
} from './keycloak';

/**
 * Signing secret.
 *
 * The previous fallback was a literal committed to the repository, which means
 * anyone with the source could mint a token for any role - including a gazetted
 * officer - and every RBAC check downstream would honour it. A committed secret
 * is not a secret.
 *
 * So: in production JWT_SECRET is mandatory and the module refuses to load
 * without it. In development a random secret is generated per process, which
 * keeps local runs working while making it impossible to ship a known key. The
 * cost is that restarting the dev server invalidates open sessions, which is
 * the right trade.
 */
const JWT_SECRET = (() => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set (or is shorter than 32 characters). Refusing to start: without it, session tokens could be forged by anyone holding a copy of this source.'
    );
  }

  if (fromEnv) {
    // eslint-disable-next-line no-console
    console.warn('[auth] JWT_SECRET is shorter than 32 characters and is being ignored. Using a per-process random secret.');
  }
  return crypto.randomBytes(48).toString('hex');
})();

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
  // Present on Keycloak (RS256) tokens — the OIDC issuer URL. Absent on
  // native HS256 tokens, so it stays optional.
  iss?: string;
  idp?: 'KEYCLOAK' | 'LOCAL_CRYPTO';
};

// ---------------------------------------------------------------------------
// 1. Base64URL Encoding Helpers
// ---------------------------------------------------------------------------
export function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64UrlDecode(str: string): string {
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
// 3. Cryptographic JWT Signing & Verification (HMAC-SHA256 & Keycloak RS256)
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
    exp: now + TOKEN_EXPIRY_SECONDS,
    idp: 'LOCAL_CRYPTO'
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

function parseVerifiedKeycloakPayload(payload: any, now: number): JWTPayload {
  const email = payload.email || payload.preferred_username || '';
  const realmRoles: string[] = payload.realm_access?.roles || [];
  const clientRoles: string[] = payload.resource_access?.['cryptotrace-frontend']?.roles || [];
  const allRoles = [...realmRoles, ...clientRoles];
  const role = resolveRoleFromKeycloak(allRoles);

  const persona = SYSTEM_PERSONAS.find(
    (p) =>
      p.email.toLowerCase() === email.toLowerCase() ||
      (p.alias_emails && p.alias_emails.some((ae) => ae.toLowerCase() === email.toLowerCase())) ||
      p.role === role ||
      p.uid === payload.sub
  );

  const isGazetted =
    payload.is_gazetted !== undefined
      ? payload.is_gazetted === true || payload.is_gazetted === 'true'
      : persona?.is_gazetted ?? false;

  return {
    id: persona?.id || (payload.user_id ? Number(payload.user_id) : 100),
    uid: payload.sub || persona?.uid || 'keycloak-user',
    email: email || persona?.email || 'officer@sih.gov.in',
    role,
    name:
      payload.name ||
      [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
      persona?.name ||
      'Keycloak Officer',
    jurisdiction_code: payload.jurisdiction_code ?? persona?.jurisdiction_code ?? null,
    clearance_level: payload.clearance_level || persona?.clearance_level || 'PUBLIC',
    is_gazetted: isGazetted,
    vasp_id: payload.vasp_id ? Number(payload.vasp_id) : persona?.vasp_id ?? null,
    iat: payload.iat || now,
    exp: payload.exp || now + TOKEN_EXPIRY_SECONDS,
    idp: 'KEYCLOAK'
  };
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    // ── Keycloak RS256 Token Handling ─────────────────────────────────────
    if (header.alg === 'RS256') {
      const verified = verifyKeycloakSignatureSync(
        encodedHeader,
        encodedPayload,
        signature,
        header.kid
      );
      if (!verified) {
        return null;
      }
      return parseVerifiedKeycloakPayload(payload, now);
    }

    // ── Native HMAC-SHA256 Verification ───────────────────────────────────
    if (header.alg === 'HS256') {
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

      return payload as JWTPayload;
    }

    // Reject any unknown or insecure algorithm (e.g., none)
    return null;
  } catch {
    return null;
  }
}

/**
 * Asynchronous JWT verifier that fetches live JWKS if an RS256 key is not yet in cache
 */
export async function verifyJWTAsync(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (header.alg === 'HS256') {
      return verifyJWT(token);
    }

    if (header.alg === 'RS256') {
      if (verifyKeycloakSignatureSync(encodedHeader, encodedPayload, signature, header.kid)) {
        return parseVerifiedKeycloakPayload(payload, now);
      }

      // Live fetch if not in cache
      const keys = await fetchKeycloakJWKS();
      if (!keys || keys.length === 0) return null;
      const matchingKey = keys.find((k) => k.kid === header.kid) || (keys.length === 1 ? keys[0] : null);
      if (!matchingKey) return null;

      try {
        const publicKey = crypto.createPublicKey({
          key: matchingKey as any,
          format: 'jwk'
        });
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${encodedHeader}.${encodedPayload}`);
        const valid = verifier.verify(
          publicKey,
          signature.replace(/-/g, '+').replace(/_/g, '/'),
          'base64'
        );
        if (!valid) return null;
        return parseVerifiedKeycloakPayload(payload, now);
      } catch {
        return null;
      }
    }

    return null;
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

export async function extractUserClaims(req: Request): Promise<JWTPayload | null> {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  return verifyJWTAsync(token);
}

export function extractUserClaimsSync(req: Request): JWTPayload | null {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  return verifyJWT(token);
}
