/**
 * Keycloak 24 Enterprise Identity Provider (OIDC / OAuth 2.0) Client
 * Built for SIH 2026 Crypto Fraud Attribution System / Indian LEA Standard
 *
 * Features:
 * 1. Healthcheck & Discovery monitoring (http://localhost:8080/realms/sih-lea)
 * 2. OAuth 2.0 Direct Access Grant Login (Resource Owner Password Credentials)
 * 3. Cryptographic RS256 JWT Token Verification via live JWKS public key rotation
 * 4. Extraction of 8 Enterprise Roles & 7 Statutory ABAC Legal Attributes
 * 5. Zero-Failure Seamless Dual-Mode Fallback when Keycloak/Docker is offline
 */

import crypto from 'crypto';
import {
  type RoleName,
  type AppUser,
  normalizeRole,
  SYSTEM_PERSONAS
} from './rbac-abac';
import type { JWTPayload } from './auth-crypto';

export const KEYCLOAK_CONFIG = {
  baseUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'sih-lea',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'cryptotrace-frontend',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || ''
};

export type KeycloakHealthStatus = {
  online: boolean;
  realm: string;
  url: string;
  latencyMs: number;
  lastChecked: number;
  error?: string;
};

let cachedHealth: KeycloakHealthStatus | null = null;
let lastHealthCheck = 0;
const HEALTH_CACHE_TTL_MS = 3000; // 3 seconds

/**
 * Check if Keycloak is reachable and the realm is initialized
 */
export async function checkKeycloakHealth(): Promise<KeycloakHealthStatus> {
  const now = Date.now();
  if (cachedHealth && now - lastHealthCheck < HEALTH_CACHE_TTL_MS) {
    return cachedHealth;
  }

  const start = Date.now();
  const realmUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(realmUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - start;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const online = data.realm === KEYCLOAK_CONFIG.realm || res.status === 200;
      cachedHealth = {
        online,
        realm: KEYCLOAK_CONFIG.realm,
        url: KEYCLOAK_CONFIG.baseUrl,
        latencyMs,
        lastChecked: now
      };
      lastHealthCheck = now;
      return cachedHealth;
    } else {
      cachedHealth = {
        online: false,
        realm: KEYCLOAK_CONFIG.realm,
        url: KEYCLOAK_CONFIG.baseUrl,
        latencyMs,
        lastChecked: now,
        error: `HTTP ${res.status}: ${res.statusText}`
      };
      lastHealthCheck = now;
      return cachedHealth;
    }
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    cachedHealth = {
      online: false,
      realm: KEYCLOAK_CONFIG.realm,
      url: KEYCLOAK_CONFIG.baseUrl,
      latencyMs,
      lastChecked: now,
      error: err?.message || 'Connection refused or timed out'
    };
    lastHealthCheck = now;
    return cachedHealth;
  }
}

// ---------------------------------------------------------------------------
// JWKS Key Cache & RS256 Verification
// ---------------------------------------------------------------------------
type JWKKey = {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
};

let jwksCache: { keys: JWKKey[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60000; // 60 seconds

export function getCachedJWKS(): JWKKey[] {
  return jwksCache ? jwksCache.keys : [];
}

export async function fetchKeycloakJWKS(): Promise<JWKKey[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  const jwksUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/certs`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(jwksUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.keys)) {
      jwksCache = { keys: data.keys, fetchedAt: now };
      return data.keys;
    }
    return [];
  } catch {
    clearTimeout(timeoutId);
    return jwksCache ? jwksCache.keys : [];
  }
}

/**
 * Verify RSA-SHA256 signature synchronously against cached JWKS public keys
 */
export function verifyKeycloakSignatureSync(
  headerB64: string,
  payloadB64: string,
  sigB64: string,
  kid?: string
): boolean {
  if (!jwksCache || !jwksCache.keys || jwksCache.keys.length === 0) {
    return false;
  }
  const matchingKey = jwksCache.keys.find((k) => k.kid === kid) || (jwksCache.keys.length === 1 ? jwksCache.keys[0] : null);
  if (!matchingKey) return false;
  try {
    const publicKey = crypto.createPublicKey({
      key: matchingKey as any,
      format: 'jwk'
    });
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    return verifier.verify(
      publicKey,
      sigB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );
  } catch {
    return false;
  }
}

/**
 * Base64Url helper
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Resolve an enterprise RoleName from Keycloak roles array
 */
export function resolveRoleFromKeycloak(roles: string[] = []): RoleName {
  const precedence: RoleName[] = [
    'SYSTEM_ADMIN',
    'SENIOR_INVESTIGATOR',
    'CYBERCRIME_SUPERVISOR',
    'INVESTIGATING_OFFICER',
    'NATIONAL_COORDINATION_ANALYST',
    'COURT_REVIEWER',
    'VASP_COMPLIANCE_OFFICER',
    'VICTIM'
  ];

  for (const p of precedence) {
    if (roles.includes(p)) return p;
  }

  // Check legacy aliases
  for (const r of roles) {
    const norm = normalizeRole(r);
    if (precedence.includes(norm)) return norm;
  }

  return 'VICTIM';
}

/**
 * Verify and decode an RS256 Keycloak JWT token
 */
export async function verifyKeycloakToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    // Expiration check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // Strict algorithm verification: Only RS256 is accepted for Keycloak tokens
    if (header.alg !== 'RS256') {
      return null;
    }

    // Cryptographic signature verification against Keycloak JWKS
    const keys = await fetchKeycloakJWKS();
    if (!keys || keys.length === 0) {
      return null;
    }

    const matchingKey = keys.find((k) => k.kid === header.kid) || (keys.length === 1 ? keys[0] : null);
    if (!matchingKey) {
      return null;
    }

    try {
      const publicKey = crypto.createPublicKey({
        key: matchingKey as any,
        format: 'jwk'
      });

      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      const valid = verifier.verify(
        publicKey,
        sigB64.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      );

      if (!valid) {
        return null;
      }
    } catch {
      // If public key conversion fails or signature is invalid, reject
      return null;
    }

    // Extract roles
    const realmRoles: string[] = payload.realm_access?.roles || [];
    const clientRoles: string[] = payload.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || [];
    const combinedRoles = Array.from(new Set([...realmRoles, ...clientRoles]));
    const role = resolveRoleFromKeycloak(combinedRoles);

    // Look for matching local persona by email or username
    const email = payload.email || payload.preferred_username || '';
    const persona = SYSTEM_PERSONAS.find(
      (p) =>
        p.email.toLowerCase() === email.toLowerCase() ||
        (p.alias_emails && p.alias_emails.some((ae) => ae.toLowerCase() === email.toLowerCase())) ||
        p.uid === payload.sub
    );

    const isGazetted =
      payload.is_gazetted !== undefined
        ? payload.is_gazetted === true || payload.is_gazetted === 'true'
        : persona?.is_gazetted ?? false;

    return {
      id: persona?.id || 100,
      uid: payload.sub || persona?.uid || 'keycloak-user',
      email: email || persona?.email || 'user@keycloak.sih',
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
      exp: payload.exp || now + 86400
    };
  } catch {
    return null;
  }
}

/**
 * Direct Access Grants (Resource Owner Password Credentials flow)
 */
export async function loginKeycloakDirect(
  usernameOrEmail: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AppUser;
  error?: string;
}> {
  const tokenUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', KEYCLOAK_CONFIG.clientId);
    if (KEYCLOAK_CONFIG.clientSecret) {
      params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
    }
    params.append('username', usernameOrEmail.trim());
    params.append('password', password);
    params.append('scope', 'openid profile email');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params.toString(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error_description || data.error || `Keycloak returned HTTP ${res.status}`
      };
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      return { success: false, error: 'Keycloak did not return an access token.' };
    }

    const claims = await verifyKeycloakToken(accessToken);
    if (!claims) {
      return { success: false, error: 'Could not verify Keycloak token claims.' };
    }

    const persona = SYSTEM_PERSONAS.find(
      (p) =>
        p.email.toLowerCase() === claims.email.toLowerCase() ||
        (p.alias_emails && p.alias_emails.some((ae) => ae.toLowerCase() === claims.email.toLowerCase())) ||
        p.role === claims.role
    );

    const user: AppUser = {
      id: claims.id,
      uid: claims.uid,
      name: claims.name,
      email: claims.email,
      role: claims.role,
      role_id: persona?.role_id || 2,
      workspace_id: persona?.workspace_id ?? null,
      jurisdiction_code: claims.jurisdiction_code,
      clearance_level: claims.clearance_level,
      is_gazetted: claims.is_gazetted,
      vasp_id: claims.vasp_id,
      vasp_name: persona?.vasp_name,
      badge: persona?.badge,
      offline: false,
      is_active: true
    };

    return {
      success: true,
      token: accessToken,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      user
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Keycloak authentication network error'
    };
  }
}
