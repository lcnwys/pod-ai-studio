import crypto from 'crypto';

export function generateNonce(bytes = 12): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function getTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

export function hmacSha256Base64Url(secretKey: string, data: string): string {
  return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('base64url');
}

export function canonicalQuery(query: Record<string, string> | null): string {
  if (!query || Object.keys(query).length === 0) return '';
  return Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function buildStringToSign(
  method: string,
  path: string,
  query: Record<string, string> | null,
  body: string | null,
  timestamp: string,
  nonce: string,
): string {
  const q = canonicalQuery(query);
  const bodyHash = sha256Hex(body ?? '');
  return `${method.toUpperCase()}\n${path}\n${q}\n${bodyHash}\n${timestamp}\n${nonce}`;
}

export function buildSignatureHeaders(
  method: string,
  path: string,
  accessKey: string,
  secretKey: string,
  query?: Record<string, string> | null,
  body?: string | null,
): Record<string, string> {
  const ts = getTimestamp();
  const n = generateNonce();
  const sts = buildStringToSign(method, path, query ?? null, body ?? null, ts, n);
  const sig = hmacSha256Base64Url(secretKey, sts);
  return {
    'X-Access-Key': accessKey,
    'X-Timestamp': ts,
    'X-Nonce': n,
    'X-Signature': sig,
  };
}
