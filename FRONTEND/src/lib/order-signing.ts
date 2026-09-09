/**
 * Digital signing of Section 94 BNSS freeze orders.
 *
 * Design, and why:
 *
 * The order is signed on the SERVER with an Ed25519 key held for the gazetted
 * officer. Browser-held keys were considered and rejected: a key in
 * localStorage dies with the browser profile, cannot be produced in court
 * months later, and gives an officer no way to prove they did not sign.
 *
 * What gets signed is a CANONICAL payload, not the rendered document. The
 * fields that carry legal weight (case, wallet, amount, statute, addressed
 * VASP, signing officer, timestamp, nonce) are serialised into a fixed byte
 * string in a fixed order, so the signature is stable across re-renders and
 * re-orderings of the JSON, and any change to a material field invalidates it.
 * A SHA-256 digest of that payload is recorded alongside, which is what the
 * court and the exchange compare.
 *
 * Verification recomputes the canonical payload from the stored order and
 * checks the signature against the officer's public key. Nothing about
 * verification trusts the stored digest or the stored signature blob - if the
 * order has been edited after signing, the recomputed payload no longer
 * matches and verification fails, which is the property that makes this worth
 * doing at all.
 *
 * Key custody in this prototype: keys are derived deterministically from
 * ORDER_SIGNING_SEED plus the officer's uid, so the same officer has the same
 * key across restarts without needing a keystore on disk. In a real
 * deployment the private half belongs in an HSM or a KMS and this module would
 * call out to it; the canonicalisation and verification logic would not change.
 */

import crypto from 'crypto';

const SIGNING_SEED = process.env.ORDER_SIGNING_SEED || 'sih2026-cryptotrace-order-signing-seed-dev-only';

if (!process.env.ORDER_SIGNING_SEED && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn(
    '[order-signing] ORDER_SIGNING_SEED is not set. Signing keys are derived from a public development seed and any signature they produce is not evidentially meaningful.'
  );
}

export type SignableOrder = {
  /** Notice reference, e.g. BNSS-2026-0842-BN */
  ref: string;
  case_number: string;
  /** Wallet addresses the order applies to. Order-insensitive: sorted below. */
  target_addresses: string[];
  blockchain_network: string;
  amount_inr: number;
  statute: string;
  target_vasp: string;
};

export type OrderSignature = {
  algorithm: 'Ed25519';
  /** Digest algorithm applied to the canonical payload before signing. */
  digest: 'SHA-256';
  /** Stable identifier for the key that signed, printable on the document. */
  key_id: string;
  /** SPKI public key, base64. Sufficient to verify offline. */
  public_key: string;
  /** SHA-256 of the canonical payload, hex. What a verifier compares. */
  payload_hash: string;
  /** Detached Ed25519 signature over the canonical payload, base64. */
  signature: string;
  /** Single-use value; prevents an identical order being replayed as a new signing. */
  nonce: string;
  signed_at: string;
  officer: {
    uid: string;
    name: string;
    designation: string;
    badge?: string;
    is_gazetted: boolean;
  };
};

/**
 * Fixed-order, fixed-format serialisation. Newline-delimited `key=value` with
 * no optional whitespace: unambiguous, human-readable in a court exhibit, and
 * not dependent on JSON key ordering.
 *
 * Any change to this function invalidates every previously issued signature,
 * so it is versioned. Bump the version and keep the old branch if the format
 * ever has to change.
 */
export function canonicalOrderPayload(order: SignableOrder, nonce: string, signedAt: string, officerUid: string): string {
  const addresses = [...order.target_addresses]
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');

  return [
    'CRYPTOTRACE-ORDER-V1',
    `statute=${order.statute}`,
    `ref=${order.ref}`,
    `case=${order.case_number}`,
    `vasp=${order.target_vasp}`,
    `network=${order.blockchain_network}`,
    `addresses=${addresses}`,
    // Fixed to paise, so 450000 and 450000.0 canonicalise identically.
    `amount_inr=${Number(order.amount_inr || 0).toFixed(2)}`,
    `officer=${officerUid}`,
    `signed_at=${signedAt}`,
    `nonce=${nonce}`,
  ].join('\n');
}

/**
 * Deterministic Ed25519 keypair for an officer. Same uid + same seed yields
 * the same key, so signatures issued before a restart still verify after one.
 */
function officerKeyPair(officerUid: string): { privateKey: crypto.KeyObject; publicKey: crypto.KeyObject; keyId: string } {
  // HKDF to a 32-byte Ed25519 seed, then wrap it in a PKCS#8 structure that
  // Node's crypto accepts. The 16-byte prefix is the fixed PKCS#8 header for
  // an Ed25519 private key (RFC 8410).
  const seed = crypto.hkdfSync('sha256', SIGNING_SEED, 'cryptotrace-order-signing', `officer:${officerUid}`, 32);
  const pkcs8 = Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    Buffer.from(seed),
  ]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const publicKey = crypto.createPublicKey(privateKey);
  const spki = publicKey.export({ format: 'der', type: 'spki' });
  const keyId = crypto.createHash('sha256').update(spki).digest('hex').slice(0, 16).toUpperCase();
  return { privateKey, publicKey, keyId };
}

export type SigningOfficer = {
  uid: string;
  name: string;
  role: string;
  badge?: string;
  is_gazetted: boolean;
};

/** Human designation printed on the order beside the signature. */
function designationFor(officer: SigningOfficer): string {
  if (!officer.is_gazetted) return officer.role;
  return 'Gazetted Police Officer (ACP / DSP or above)';
}

/**
 * Sign an order. The gazetted check is NOT performed here - it belongs with
 * the ABAC policy (POL-05) at the API boundary, and duplicating it would mean
 * two places to keep in step. This function refuses only what it can judge:
 * an order missing the fields that give the signature meaning.
 */
export function signOrder(order: SignableOrder, officer: SigningOfficer): OrderSignature {
  if (!order.ref || !order.case_number) {
    throw new Error('Cannot sign an order without a reference and a case number.');
  }
  if (!order.target_addresses || order.target_addresses.length === 0) {
    throw new Error('Cannot sign an order that names no wallet address.');
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const signedAt = new Date().toISOString();
  const payload = canonicalOrderPayload(order, nonce, signedAt, officer.uid);

  const { privateKey, publicKey, keyId } = officerKeyPair(officer.uid);
  const signature = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKey);

  return {
    algorithm: 'Ed25519',
    digest: 'SHA-256',
    key_id: keyId,
    public_key: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
    payload_hash: crypto.createHash('sha256').update(payload).digest('hex'),
    signature: signature.toString('base64'),
    nonce,
    signed_at: signedAt,
    officer: {
      uid: officer.uid,
      name: officer.name,
      designation: designationFor(officer),
      badge: officer.badge,
      is_gazetted: officer.is_gazetted,
    },
  };
}

export type VerificationResult = {
  valid: boolean;
  /** Plain-language finding, suitable to show a judge or a compliance officer. */
  reason: string;
  /** Recomputed hash. Differs from the recorded one when the order was altered. */
  computed_hash?: string;
  recorded_hash?: string;
  checks: { label: string; passed: boolean; detail?: string }[];
};

/**
 * Recompute and verify. Deliberately reports each check separately rather than
 * a bare boolean: "signature valid" and "the document in front of you is the
 * document that was signed" are different claims, and a verifier needs to see
 * which one failed.
 */
export function verifyOrderSignature(order: SignableOrder, sig: OrderSignature | null | undefined): VerificationResult {
  const checks: { label: string; passed: boolean; detail?: string }[] = [];

  if (!sig) {
    return {
      valid: false,
      reason: 'This order carries no digital signature. It has not been authorised by a gazetted officer.',
      checks: [{ label: 'Signature present', passed: false }],
    };
  }

  checks.push({ label: 'Signature present', passed: true, detail: `${sig.algorithm} · key ${sig.key_id}` });

  const payload = canonicalOrderPayload(order, sig.nonce, sig.signed_at, sig.officer.uid);
  const computedHash = crypto.createHash('sha256').update(payload).digest('hex');

  const hashMatches = computedHash === sig.payload_hash;
  checks.push({
    label: 'Order content unchanged since signing',
    passed: hashMatches,
    detail: hashMatches
      ? `SHA-256 ${computedHash.slice(0, 24)}…`
      : 'The recomputed digest does not match the digest recorded at signing.',
  });

  // Independent of the recorded digest: verify the signature against the
  // payload we just recomputed. A tampered order fails here even if someone
  // also updated the stored hash to match their edit.
  let signatureValid = false;
  let keyMatches = false;
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(sig.public_key, 'base64'),
      format: 'der',
      type: 'spki',
    });
    signatureValid = crypto.verify(null, Buffer.from(payload, 'utf8'), publicKey, Buffer.from(sig.signature, 'base64'));

    // The embedded public key must be the officer's real key, otherwise a
    // forger could sign with their own keypair and ship the matching public
    // half alongside.
    const expected = officerKeyPair(sig.officer.uid).publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    keyMatches = expected === sig.public_key;
  } catch {
    signatureValid = false;
  }

  checks.push({
    label: 'Ed25519 signature verifies',
    passed: signatureValid,
    detail: signatureValid ? undefined : 'The signature does not verify against the order as stored.',
  });
  checks.push({
    label: 'Key belongs to the named officer',
    passed: keyMatches,
    detail: keyMatches
      ? `${sig.officer.name} · key ${sig.key_id}`
      : 'The public key in the signature block is not the key registered to this officer.',
  });
  checks.push({
    label: 'Signed by a gazetted officer',
    passed: sig.officer.is_gazetted,
    detail: sig.officer.designation,
  });

  const valid = checks.every((c) => c.passed);

  return {
    valid,
    reason: valid
      ? `Signature verified. Order ${order.ref} was signed by ${sig.officer.name} (${sig.officer.designation}) on ${new Date(sig.signed_at).toLocaleString('en-IN')} and has not been altered since.`
      : hashMatches && !signatureValid
      ? 'Signature verification failed. The order cannot be relied upon as authorised.'
      : !hashMatches
      ? 'This order has been altered after it was signed. The signature does not cover the document as it now stands.'
      : 'Signature verification failed.',
    computed_hash: computedHash,
    recorded_hash: sig.payload_hash,
    checks,
  };
}

/** The officer's public key, so a verifier can check the order offline. */
export function officerPublicKey(officerUid: string): { key_id: string; public_key: string } {
  const { publicKey, keyId } = officerKeyPair(officerUid);
  return { key_id: keyId, public_key: publicKey.export({ format: 'der', type: 'spki' }).toString('base64') };
}
