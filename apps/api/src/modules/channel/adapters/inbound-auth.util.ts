import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Per-connection inbound authentication (closes CRITICAL #3 from the security audit).
 *
 * Each `channelConnections.config.inboundAuth` carries the credentials a specific
 * OTA must present when pushing into HAIP:
 *
 *   { username: '...', password: '...' }                  // Basic Auth (Booking.com)
 *   { secret: '...' }                                     // HMAC-SHA256 (Expedia & similar)
 *   { bearerToken: '...' }                                // Bearer token (DerbySoft → PMS)
 *
 * The previous code never validated the `Authorization` header at all, so anyone
 * who reached the public webhook URL could inject reservations/cancellations.
 *
 * `config.inboundAuth` lives inside the existing encrypted-at-app `config` jsonb;
 * no schema change required.
 */
export interface InboundBasicAuth {
  username: string;
  password: string;
}
export interface InboundHmacAuth {
  /** Shared secret used as the HMAC-SHA256 key (raw, not hashed). */
  secret: string;
}
export interface InboundBearerAuth {
  /** Opaque bearer token DerbySoft presents on LiveCheck/Book/Modify/Cancel. */
  bearerToken: string;
}

/** Compare credentials in constant time without treating them as stored password hashes. */
function constantTimeEqualStr(a: string, b: string): boolean {
  // Authorization headers are capped at 8 KiB; reject oversized configured values too.
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  const maxBytes = 8192;
  if (left.length > maxBytes || right.length > maxBytes) return false;

  // Fixed-size buffers plus an encoded length avoid a length-dependent timingSafeEqual call.
  const leftPadded = Buffer.alloc(maxBytes + 4);
  const rightPadded = Buffer.alloc(maxBytes + 4);
  left.copy(leftPadded, 0);
  right.copy(rightPadded, 0);
  leftPadded.writeUInt32BE(left.length, maxBytes);
  rightPadded.writeUInt32BE(right.length, maxBytes);
  return timingSafeEqual(leftPadded, rightPadded);
}

/** Parse Authorization credentials with bounded, linear-time handling. */
function authorizationCredential(header: string, scheme: string): string | undefined {
  if (header.length > 8192) return undefined;
  const value = header.trim();
  if (value.length <= scheme.length || value.slice(0, scheme.length).toLowerCase() !== scheme.toLowerCase()) return undefined;
  const separator = value.charCodeAt(scheme.length);
  if (separator !== 32 && (separator < 9 || separator > 13)) return undefined;
  let index = scheme.length;
  while (index < value.length) {
    const code = value.charCodeAt(index);
    if (code === 32 || (code >= 9 && code <= 13)) index++;
    else break;
  }
  const credential = value.slice(index).trim();
  return credential || undefined;
}


/**
 * Verify a `Authorization: Basic <base64(user:pass)>` header against the stored
 * Basic-Auth credentials on a channel connection. Returns true iff both match in
 * constant time. Missing creds → false (fail closed).
 */
export function verifyBasicAuth(
  authHeader: string | undefined | null,
  stored: InboundBasicAuth | undefined,
): boolean {
  if (!stored?.username || !stored?.password) return false;
  if (typeof authHeader !== 'string' || !authHeader) return false;
  const credential = authorizationCredential(authHeader, 'Basic');
  if (!credential) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(credential, 'base64').toString('utf8');
  } catch {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  // Evaluate BOTH comparisons so timing doesn't reveal whether username matched.
  const userOk = constantTimeEqualStr(user, stored.username);
  const passOk = constantTimeEqualStr(pass, stored.password);
  return userOk && passOk;
}

/**
 * Verify an HMAC-SHA256 signature header against a shared secret over the raw
 * request body. Header is the hex digest (most providers emit hex; some prefix
 * `sha256=` which we strip). Constant-time compare; fail closed on missing input.
 */
export function verifyHmacSignature(
  signatureHeader: string | undefined | null,
  rawBody: string,
  stored: InboundHmacAuth | undefined,
): boolean {
  if (!stored?.secret) return false;
  if (typeof signatureHeader !== 'string' || !signatureHeader) return false;
  if (signatureHeader.length > 80) return false;
  const provided = signatureHeader.trim().replace(/^sha256=/i, '').toLowerCase();
  if (provided.length !== 64 || !/^[0-9a-f]{64}$/i.test(provided)) return false;
  const expected = createHmac('sha256', stored.secret).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}

/**
 * Verify `Authorization: Bearer <token>` against the stored bearer token on a
 * channel connection. Constant-time; fail closed on missing input.
 */
export function verifyBearerAuth(
  authHeader: string | undefined | null,
  stored: InboundBearerAuth | undefined,
): boolean {
  if (!stored?.bearerToken) return false;
  if (typeof authHeader !== 'string' || !authHeader) return false;
  const credential = authorizationCredential(authHeader, 'Bearer');
  if (!credential) return false;
  return constantTimeEqualStr(credential, stored.bearerToken);
}

/** Extract `inboundAuth` from a channel connection's `config` jsonb safely. */
export function getInboundAuth<T = InboundBasicAuth | InboundHmacAuth | InboundBearerAuth>(
  config: unknown,
): T | undefined {
  if (!config || typeof config !== 'object') return undefined;
  const cfg = config as Record<string, unknown>;
  const ia = cfg['inboundAuth'];
  if (!ia || typeof ia !== 'object') return undefined;
  return ia as T;
}
