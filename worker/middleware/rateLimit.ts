// Rate limiting middleware for Cloudflare Workers + D1
// Uses cf-connecting-ip to identify clients, D1 to track request counts per window.

import { MiddlewareHandler } from 'hono';
import type { Env } from '../index';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  read: { windowMs: 60_000, maxRequests: 60 },
  write: { windowMs: 60_000, maxRequests: 20 },
  webhook: { windowMs: 60_000, maxRequests: 30 },
  // Admin routes get the strictest limit. A legitimate admin refreshes
  // occasionally; anything above a dozen req/min is almost certainly
  // a bot or scanner probing the /admin/* path.
  admin: { windowMs: 60_000, maxRequests: 12 },
};

type RateLimitEnv = { Bindings: Env; Variables: { userId: string; userEmail?: string } };

/**
 * Determine which rate limit bucket a request falls into based on method and path.
 * Returns null for routes that should skip rate limiting entirely.
 */
function getLimitType(method: string, path: string): string | null {
  // Health endpoint is never rate limited
  if (path === '/health') return null;

  // Admin routes first - tighter than any other bucket.
  // Applies to /admin/check too, so unauthenticated probing is capped.
  if (path.startsWith('/admin/')) return 'admin';

  // Webhooks get their own bucket
  if (path.startsWith('/webhooks/')) return 'webhook';

  // Auth-related endpoints (stricter limits)
  if (path.startsWith('/auth/') || path.startsWith('/login') || path.startsWith('/signup')) {
    return 'auth';
  }

  // Reads vs writes
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return 'read';
  }

  return 'write';
}

/**
 * Get the current window start timestamp (floored to the nearest window).
 */
function getWindowStart(windowMs: number): number {
  const now = Date.now();
  return Math.floor(now / windowMs) * windowMs;
}

/**
 * Hono middleware that enforces per-IP rate limits using D1.
 * Must be applied BEFORE auth middleware so unauthenticated abuse is also caught.
 */
export function rateLimit(): MiddlewareHandler<RateLimitEnv> {
  return async (c, next) => {
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;

    const limitType = getLimitType(method, path);
    if (!limitType) {
      // No rate limiting for this route
      await next();
      return;
    }

    const config = LIMITS[limitType];
    if (!config) {
      await next();
      return;
    }

    // Prefer userId (set by auth middleware) over IP - mobile NAT and
    // residential proxies make IP-only rate limiting trivially bypassable.
    const userId = (c as { get?: (k: string) => string | undefined }).get?.('userId');
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const principal = userId ? `user:${userId}` : `ip:${clientIp}`;

    const key = `${principal}:${limitType}`;
    const windowStart = getWindowStart(config.windowMs);
    const db = c.env.DB;

    try {
      // Atomically increment or insert the counter for this window
      await db
        .prepare(
          `INSERT INTO rate_limits (key, window_start, request_count)
           VALUES (?, ?, 1)
           ON CONFLICT (key, window_start)
           DO UPDATE SET request_count = request_count + 1`,
        )
        .bind(key, windowStart)
        .run();

      // Read the current count
      const row = await db
        .prepare('SELECT request_count FROM rate_limits WHERE key = ? AND window_start = ?')
        .bind(key, windowStart)
        .first<{ request_count: number }>();

      const currentCount = row?.request_count ?? 1;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTimestamp = Math.ceil((windowStart + config.windowMs) / 1000);

      // Set rate limit headers on all responses
      c.header('X-RateLimit-Limit', String(config.maxRequests));
      c.header('X-RateLimit-Remaining', String(remaining));
      c.header('X-RateLimit-Reset', String(resetTimestamp));

      if (currentCount > config.maxRequests) {
        c.header('Retry-After', String(Math.ceil(config.windowMs / 1000)));
        return c.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
            },
          },
          429,
        );
      }
    } catch (err) {
      // If rate limiting fails, fail closed for sensitive buckets, fail open for others.
      console.error('[RateLimit] D1 error:', err);
      const sensitiveBuckets = new Set(['auth', 'admin', 'billing', 'banking', 'mtd', 'write']);
      if (sensitiveBuckets.has(limitType)) {
        c.header('Retry-After', String(Math.ceil(config.windowMs / 1000)));
        return c.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
            },
          },
          429,
        );
      }
    }

    await next();
  };
}

/**
 * Purge expired rate limit entries from D1.
 * Call this from the cron handler to keep the table small.
 */
export async function purgeExpiredRateLimits(db: D1Database): Promise<number> {
  // Delete all entries older than the largest window (60s) plus a buffer
  const cutoff = Date.now() - 120_000;
  const result = await db
    .prepare('DELETE FROM rate_limits WHERE window_start < ?')
    .bind(cutoff)
    .run();
  return (result.meta?.changes as number) ?? 0;
}
