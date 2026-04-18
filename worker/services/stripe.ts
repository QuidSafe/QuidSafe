// Stripe subscription service for Cloudflare Workers
// Handles checkout sessions, customer portal, and webhook events

import { execute, queryOne } from '../../lib/db';

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceMonthly?: string;
  priceAnnual?: string;
}

// ─── Stripe API helpers (no SDK - Workers use fetch) ──────

async function stripeRequest<T>(
  path: string,
  config: StripeConfig,
  options: { method?: string; body?: URLSearchParams; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(config.secretKey + ':')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: options.body?.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    // Log the raw error internally for debugging but throw a sanitised
    // message to avoid leaking Stripe internals to clients/logs.
    console.error('[Stripe API error]', { status: response.status, body: error.slice(0, 500) });
    throw new Error(`Payment provider error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

// ─── Checkout Session ─────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  plan: 'monthly' | 'annual',
  config: StripeConfig,
  db: D1Database,
  appUrl = 'https://quidsafe.uk',
): Promise<{ url: string }> {
  // Get or create Stripe customer
  let user = await queryOne<{ stripe_customer_id: string; email: string }>(
    db,
    'SELECT stripe_customer_id, email FROM users WHERE id = ?',
    [userId],
  );

  let customerId = user?.stripe_customer_id;

  if (!customerId && user?.email) {
    const customer = await stripeRequest<{ id: string }>(
      '/customers',
      config,
      { body: new URLSearchParams({ email: user.email, 'metadata[user_id]': userId }) },
    );
    customerId = customer.id;
    await execute(db, 'UPDATE users SET stripe_customer_id = ?, updated_at = datetime(\'now\') WHERE id = ?', [customerId, userId]);
  }

  if (!customerId) {
    throw new Error('Cannot create checkout: no Stripe customer ID and no email on file');
  }

  // Pre-created Stripe Price IDs are required - no inline fallback.
  // This ensures prices are auditable in the Stripe dashboard and never
  // injectable via the checkout flow.
  const priceId = plan === 'annual' ? config.priceAnnual : config.priceMonthly;
  if (!priceId) {
    throw new Error(`Stripe Price ID not configured for plan: ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} secret.`);
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    customer: customerId!,
    'line_items[0][quantity]': '1',
    'line_items[0][price]': priceId,
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/cancel`,
    'subscription_data[trial_period_days]': '30',
    'subscription_data[metadata][user_id]': userId,
    'metadata[user_id]': userId,
  });

  // Idempotency bucket: 5-minute window per user+plan to prevent duplicate
  // checkout sessions from accidental client retries.
  const bucket = Math.floor(Date.now() / 300_000);
  const idempotencyKey = `checkout:${userId}:${plan}:${bucket}`;
  const session = await stripeRequest<{ url: string }>('/checkout/sessions', config, { body: params, idempotencyKey });
  return { url: session.url };
}

// ─── Customer Portal ──────────────────────────────────────

export async function createPortalSession(
  userId: string,
  config: StripeConfig,
  db: D1Database,
  appUrl = 'https://quidsafe.uk',
): Promise<{ url: string }> {
  const user = await queryOne<{ stripe_customer_id: string }>(
    db,
    'SELECT stripe_customer_id FROM users WHERE id = ?',
    [userId],
  );

  if (!user?.stripe_customer_id) {
    throw new Error('No Stripe customer found. Subscribe first.');
  }

  const params = new URLSearchParams({
    customer: user.stripe_customer_id,
    return_url: `${appUrl}/settings`,
  });

  const session = await stripeRequest<{ url: string }>('/billing_portal/sessions', config, { body: params });
  return { url: session.url };
}

// ─── Subscription Status ──────────────────────────────────

export async function getSubscriptionStatus(
  userId: string,
  db: D1Database,
): Promise<{ plan: string; status: string; trialEndsAt: string | null; currentPeriodEnd: string | null }> {
  const sub = await queryOne<{
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  }>(db, 'SELECT plan, status, trial_ends_at, current_period_end FROM subscriptions WHERE user_id = ?', [userId]);

  if (!sub) {
    return { plan: 'none', status: 'requires_setup', trialEndsAt: null, currentPeriodEnd: null };
  }

  return {
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trial_ends_at,
    currentPeriodEnd: sub.current_period_end,
  };
}

// ─── Timing-safe comparison (Workers-compatible) ─────────

function arrayBufferEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    crypto.getRandomValues(new Uint8Array(32)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, aBytes),
    crypto.subtle.sign('HMAC', key, bBytes),
  ]);
  return arrayBufferEqual(macA, macB);
}

// ─── Webhook Handler ──────────────────────────────────────

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const v1Sig = parts.find((p) => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !v1Sig) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  // Compute expected signature
  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, v1Sig);
}

interface StripeEvent {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      status: string;
      metadata?: { user_id?: string };
      current_period_start?: number;
      current_period_end?: number;
      trial_end?: number | null;
      items?: { data: { price: { recurring: { interval: string } } }[] };
    };
  };
}

export async function handleWebhookEvent(event: StripeEvent, db: D1Database): Promise<void> {
  const obj = event.data.object;
  const userId = obj.metadata?.user_id;

  switch (event.type) {
    case 'checkout.session.completed': {
      // Session completed - subscription created separately
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      if (!userId) break;

      // Defence in depth: cross-check the customer in D1 to prevent a
      // compromised Stripe key from upgrading arbitrary accounts.
      if (obj.customer) {
        const existing = await db.prepare(
          'SELECT id FROM users WHERE id = ? AND (stripe_customer_id = ? OR stripe_customer_id IS NULL)'
        ).bind(userId, obj.customer).first();
        if (!existing) {
          console.warn('[Stripe webhook] customer mismatch, rejecting', { userId, customer: obj.customer });
          break;
        }
      }

      const interval = obj.items?.data[0]?.price?.recurring?.interval;
      const plan = interval === 'year' ? 'pro_annual' : 'pro_monthly';
      const status = obj.status === 'active' ? 'active' : obj.status === 'trialing' ? 'trialing' : obj.status === 'past_due' ? 'past_due' : 'cancelled';

      const periodStart = obj.current_period_start ? new Date(obj.current_period_start * 1000).toISOString() : null;
      const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
      const trialEnd = obj.trial_end ? new Date(obj.trial_end * 1000).toISOString() : null;

      // Batch upsert subscription + update user tier atomically
      let tier: string;
      if (status === 'active' || status === 'trialing') {
        tier = 'pro';
      } else if (status === 'past_due') {
        tier = 'past_due';
      } else {
        tier = 'cancelled';
      }
      await db.batch([
        db.prepare(
          `INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, trial_ends_at, current_period_start, current_period_end)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             stripe_subscription_id = excluded.stripe_subscription_id,
             plan = excluded.plan,
             status = excluded.status,
             trial_ends_at = excluded.trial_ends_at,
             current_period_start = excluded.current_period_start,
             current_period_end = excluded.current_period_end`
        ).bind(crypto.randomUUID(), userId, obj.customer, obj.id, plan, status, trialEnd, periodStart, periodEnd),
        db.prepare(
          'UPDATE users SET subscription_tier = ?, grace_period_ends = CASE WHEN ? IN (\'active\', \'trialing\') THEN NULL ELSE grace_period_ends END, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(tier, status, userId),
      ]);
      break;
    }

    case 'invoice.payment_succeeded': {
      // Payment went through - subscription.updated handles the rest
      break;
    }

    case 'invoice.payment_failed': {
      if (!userId) break;
      const gracePeriodEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.batch([
        db.prepare('UPDATE subscriptions SET status = \'past_due\' WHERE user_id = ?').bind(userId),
        db.prepare('UPDATE users SET subscription_tier = \'past_due\', grace_period_ends = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(gracePeriodEnds, userId),
      ]);
      break;
    }

    case 'customer.subscription.deleted': {
      if (!userId) break;
      await db.batch([
        db.prepare('UPDATE subscriptions SET status = \'cancelled\' WHERE user_id = ?').bind(userId),
        db.prepare('UPDATE users SET subscription_tier = \'cancelled\', grace_period_ends = NULL, updated_at = datetime(\'now\') WHERE id = ?').bind(userId),
      ]);
      break;
    }
  }
}
