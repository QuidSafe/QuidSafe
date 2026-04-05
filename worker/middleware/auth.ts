// Clerk JWT verification middleware for Cloudflare Workers
// Verifies the Bearer token from Clerk and attaches userId to context

import { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../index';

interface ClerkJWTPayload {
  sub: string;       // Clerk user ID
  email?: string;
  exp: number;
  iat: number;
  iss: string;
}

type AuthEnv = { Bindings: Env; Variables: { userId: string; userEmail?: string } };

/**
 * Decode a base64url string to Uint8Array (Workers-compatible, no Node Buffer)
 */
function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify a Clerk JWT using the JWKS endpoint.
 * Clerk publishes its public keys at https://<clerk-domain>/.well-known/jwks.json
 */
async function verifyClerkJWT(token: string, publishableKey: string): Promise<ClerkJWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const headerStr = new TextDecoder().decode(base64urlDecode(parts[0]));
  const header = JSON.parse(headerStr) as { kid: string; alg: string };

  const payloadStr = new TextDecoder().decode(base64urlDecode(parts[1]));
  const payload = JSON.parse(payloadStr) as ClerkJWTPayload;

  // Check expiration
  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  // Extract Clerk frontend API domain from publishable key
  // pk_test_xxx or pk_live_xxx → decode the base64 part after pk_test_/pk_live_
  const keyPart = publishableKey.replace(/^pk_(test|live)_/, '');
  const clerkDomain = atob(keyPart).replace(/\$$/, '');

  // Fetch JWKS from Clerk
  const jwksUrl = `https://${clerkDomain}/.well-known/jwks.json`;
  const jwksResponse = await fetch(jwksUrl, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!jwksResponse.ok) throw new Error('Failed to fetch Clerk JWKS');

  const jwks = (await jwksResponse.json()) as {
    keys: { kid: string; kty: string; n: string; e: string; alg: string; use: string }[];
  };

  const key = jwks.keys.find((k) => k.kid === header.kid);
  if (!key) throw new Error('Signing key not found in JWKS');

  // Import the public key
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    { kty: key.kty, n: key.n, e: key.e, alg: key.alg, ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Verify signature
  const signatureBytes = base64urlDecode(parts[2]);
  const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signatureBytes, dataBytes);

  if (!valid) throw new Error('Invalid JWT signature');

  return payload;
}

/**
 * Hono middleware: verifies Clerk JWT and sets userId in context.
 * Skip for public routes (health, webhooks).
 */
export function clerkAuth(): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyClerkJWT(token, c.env.CLERK_PUBLISHABLE_KEY);
      c.set('userId', payload.sub);
      if (payload.email) c.set('userEmail', payload.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      return c.json({ error: { code: 'UNAUTHORIZED', message } }, 401);
    }

    await next();
  };
}
