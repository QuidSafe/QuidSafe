// Stripe subscription service for Cloudflare Workers
// Handles checkout sessions, customer portal, and webhook events

import { execute, queryOne } from '../../lib/db';

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

// ─── Stripe API helpers (no SDK — Workers use fetch) ──────

async function stripeRequest<T>(
  path: string,
  config: StripeConfig,
  options: { method?: string; body?: URLSearchParams } = {},
): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: options.method ?? 'POST',
    headers: {
      Authorization: `Basic ${btoa(config.secretKey + ':')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: options.body?.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

// ─── Checkout Session ─────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  plan: 'monthly' | 'annual',
  config: StripeConfig,
  db: D1Database,
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

  // Price IDs — set these in Stripe Dashboard and store in env vars
  // For now, use lookup_keys
  const priceParam = plan === 'annual'
    ? { 'line_items[0][price_data][unit_amount]': '5999', 'line_items[0][price_data][recurring][interval]': 'year' }
    : { 'line_items[0][price_data][unit_amount]': '799', 'line_items[0][price_data][recurring][interval]': 'month' };

  const params = new URLSearchParams({
    mode: 'subscription',
    customer: customerId!,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][product_data][name]': 'QuidSafe Pro',
    ...priceParam,
    success_url: 'https://app.quidsafe.co.uk/billing/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://app.quidsafe.co.uk/billing/cancel',
    'subscription_data[trial_period_days]': '14',
    'subscription_data[metadata][user_id]': userId,
    'metadata[user_id]': userId,
  });

  const session = await stripeRequest<{ url: string }>('/checkout/sessions', config, { body: params });
  return { url: session.url };
}

// ─── Customer Portal ──────────────────────────────────────

export async function createPortalSession(
  userId: string,
  config: StripeConfig,
  db: D1Database,
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
    return_url: 'https://app.quidsafe.co.uk/settings',
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

  return expected === v1Sig;
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
      // Session completed — subscription created separately
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      if (!userId) break;

      const interval = obj.items?.data[0]?.price?.recurring?.interval;
      const plan = interval === 'year' ? 'pro_annual' : 'pro_monthly';
      const status = obj.status === 'active' ? 'active' : obj.status === 'trialing' ? 'trialing' : obj.status === 'past_due' ? 'past_due' : 'cancelled';

      const periodStart = obj.current_period_start ? new Date(obj.current_period_start * 1000).toISOString() : null;
      const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
      const trialEnd = obj.trial_end ? new Date(obj.trial_end * 1000).toISOString() : null;

      // Upsert subscription
      await execute(
        db,
        `INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, trial_ends_at, current_period_start, current_period_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           stripe_subscription_id = excluded.stripe_subscription_id,
           plan = excluded.plan,
           status = excluded.status,
           trial_ends_at = excluded.trial_ends_at,
           current_period_start = excluded.current_period_start,
           current_period_end = excluded.current_period_end`,
        [crypto.randomUUID(), userId, obj.customer, obj.id, plan, status, trialEnd, periodStart, periodEnd],
      );

      // Update user tier based on Stripe subscription status
      let tier: string;
      if (status === 'active' || status === 'trialing') {
        tier = 'pro';
      } else if (status === 'past_due') {
        tier = 'past_due';
      } else {
        tier = 'cancelled';
        console.warn(`[Stripe] Unexpected subscription status '${status}' for user ${userId} — defaulting to cancelled`);
      }
      await execute(db, 'UPDATE users SET subscription_tier = ?, grace_period_ends = CASE WHEN ? IN (\'active\', \'trialing\') THEN NULL ELSE grace_period_ends END, updated_at = datetime(\'now\') WHERE id = ?', [tier, status, userId]);
      break;
    }

    case 'invoice.payment_succeeded': {
      // Payment went through — subscription.updated handles the rest
      break;
    }

    case 'invoice.payment_failed': {
      if (!userId) break;
      // Set 7-day grace period instead of immediately revoking access
      const gracePeriodEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await execute(
        db,
        'UPDATE subscriptions SET status = \'past_due\' WHERE user_id = ?',
        [userId],
      );
      await execute(
        db,
        'UPDATE users SET subscription_tier = \'past_due\', grace_period_ends = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [gracePeriodEnds, userId],
      );
      break;
    }

    case 'customer.subscription.deleted': {
      if (!userId) break;
      await execute(db, 'UPDATE subscriptions SET status = \'cancelled\' WHERE user_id = ?', [userId]);
      await execute(db, 'UPDATE users SET subscription_tier = \'cancelled\', grace_period_ends = NULL, updated_at = datetime(\'now\') WHERE id = ?', [userId]);
      break;
    }
  }
}
