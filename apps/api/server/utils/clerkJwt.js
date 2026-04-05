const crypto = require('crypto');

const JWKS_CACHE_TTL_MS = 1000 * 60 * 10;
const jwksCache = new Map();

function base64UrlDecode(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

function parseJwt(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));

  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: base64UrlDecode(parts[2]),
  };
}

async function fetchJwks(jwksUrl) {
  const cacheKey = String(jwksUrl);
  const cached = jwksCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const response = await fetch(jwksUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Unable to fetch Clerk JWKS (${response.status})`);
  }

  const payload = await response.json();
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];
  jwksCache.set(cacheKey, { keys, expiresAt: Date.now() + JWKS_CACHE_TTL_MS });
  return keys;
}

function resolvePemFromJwk(jwk) {
  const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return keyObject.export({ format: 'pem', type: 'spki' });
}

async function verifyClerkJwt(token, { jwksUrl, issuer, audience }) {
  const decoded = parseJwt(token);
  const { header, payload, signingInput, signature } = decoded;

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported Clerk JWT header');
  }

  const keys = await fetchJwks(jwksUrl);
  const jwk = keys.find((item) => item.kid === header.kid);
  if (!jwk) {
    throw new Error('Clerk signing key not found');
  }

  const pem = resolvePemFromJwk(jwk);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();

  const validSignature = verifier.verify(pem, signature);
  if (!validSignature) {
    throw new Error('Invalid Clerk JWT signature');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && Number(payload.exp) < nowSeconds) {
    throw new Error('Clerk JWT expired');
  }

  if (payload.nbf && Number(payload.nbf) > nowSeconds) {
    throw new Error('Clerk JWT not active yet');
  }

  if (issuer && payload.iss !== issuer) {
    throw new Error('Clerk JWT issuer mismatch');
  }

  if (audience) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
    if (!audiences.includes(audience)) {
      throw new Error('Clerk JWT audience mismatch');
    }
  }

  return payload;
}

module.exports = { verifyClerkJwt };
