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

    const allowed = isAdmin(email, c.env.ADMIN_EMAILS);

    // Log userId + allowed only. Email is PII - Cloudflare Workers tail logs
    // are visible to any account member with "Workers Logs" permissions.
    console.log('[admin]', {
      userId,
      path: c.req.path,
      method: c.req.method,
      allowed,
      ts: new Date().toISOString(),
    });

    if (!allowed) {
      // Return 404 (not 403) so the admin surface isn't enumerable by
      // regular authenticated users. Real admins know the URL.
      return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
    }

    await next();
  };
}
