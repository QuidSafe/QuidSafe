// Admin gate - runs after clerkAuth, rejects non-admin emails with 403.
// Reads the allowlist from env.ADMIN_EMAILS (comma-separated). Every request
// is logged so Workers logs have a minimal audit trail.

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index';

type AdminEnv = { Bindings: Env; Variables: { userId: string; userEmail?: string } };

function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAdmin(email: string | undefined, adminEmailsRaw: string | undefined): boolean {
  if (!email) return false;
  const allow = parseAdminEmails(adminEmailsRaw);
  return allow.includes(email.toLowerCase());
}

export function adminAuth(): MiddlewareHandler<AdminEnv> {
  return async (c, next) => {
    const email = c.get('userEmail');
    const userId = c.get('userId');
    const path = c.req.path;
    const method = c.req.method;

    // Require cf-connecting-ip on admin routes. Cloudflare's edge sets this
    // header on every proxied request and it cannot be forged by a browser
    // client. Its absence means the request bypassed the Cloudflare proxy
    // (e.g. someone hit the raw workers.dev origin) - reject outright so
    // an attacker can't forge x-forwarded-for and poison the audit log.
    const cfConnectingIp = c.req.header('cf-connecting-ip');
    if (!cfConnectingIp) {
      console.warn('[admin] rejected - no cf-connecting-ip (origin bypass?)');
      return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
    }

    const allowed = isAdmin(email, c.env.ADMIN_EMAILS);

    // Log userId + allowed only. Email is PII - Cloudflare Workers tail logs
    // are visible to any account member with "Workers Logs" permissions.
    console.log('[admin]', {
      userId,
      path,
      method,
      allowed,
      ts: new Date().toISOString(),
    });

    // Persistent audit trail in D1. Fire-and-forget via waitUntil so the
    // write doesn't add latency to the admin response. If the insert fails
    // (e.g. migration 021 hasn't been applied yet), the error is logged at
    // warn level so it surfaces clearly in `wrangler tail` - we don't want
    // the audit side-effect to block legitimate admin traffic, but we also
    // don't want a silently broken audit trail.
    const userAgent = c.req.header('user-agent') || null;
    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        `INSERT INTO admin_access_log (id, user_id, path, method, allowed, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(crypto.randomUUID(), userId ?? 'unknown', path, method, allowed ? 1 : 0, cfConnectingIp, userAgent)
        .run()
        .catch((err: unknown) => {
          console.warn('[admin] audit write failed (is migration 021 applied?):', err instanceof Error ? err.message : err);
        }),
    );

    if (!allowed) {
      // Return 404 (not 403) so the admin surface isn't enumerable by
      // regular authenticated users. Real admins know the URL.
      return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
    }

    await next();
  };
}
