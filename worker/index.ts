import { Hono, type Context, type Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { clerkAuth } from './middleware/auth';
import { rateLimit, purgeExpiredRateLimits } from './middleware/rateLimit';
import {
  getConnectUrl,
  exchangeCode,
  encryptTokens,
  refreshAccessToken,
  syncTransactions,
  detectBankName,
} from './services/banking';
import type { TrueLayerConfig, BankConnectionRow } from './services/banking';
import { categoriseTransactions } from './services/categoriser';
import { calculateTax, getCurrentQuarter, getQuarterDates, formatCurrency } from '../lib/tax-engine';
import {
  sendPushNotifications,
  buildPushMessages,
  getUKTaxDeadlines,
  deadlineReminder14Days,
  deadlineReminder7Days,
  deadlineUrgent3Days,
  deadlineUrgent1Day,
  weeklySummary,
  mtdSubmissionReady,
  bankReauthNeeded,
  trialEnding,
} from './services/notifications';
import {
  getHmrcAuthUrl,
  exchangeHmrcCode,
  getObligations,
  submitQuarterlyUpdate,
} from './services/hmrc';
import { sendInvoiceEmail } from './services/emailService';
import type { HmrcConfig } from './services/hmrc';
import { query, queryOne, execute } from '../lib/db';
import { audit, auditContext } from './utils/auditLog';
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  verifyWebhookSignature,
  handleWebhookEvent,
} from './services/stripe';
import {
  signupSchema,
  createExpenseSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createRecurringExpenseSchema,
  updateRecurringExpenseSchema,
  updateSettingsSchema,
  updateExpenseSchema,
  updateTransactionCategorySchema,
  checkoutSchema,
  mtdCallbackSchema,
  mtdSubmitQuarterlySchema,
  registerDeviceSchema,
  deleteDeviceSchema,
  sendInvoiceEmailSchema,
} from './validation';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUELAYER_CLIENT_ID: string;
  TRUELAYER_CLIENT_SECRET: string;
  TRUELAYER_REDIRECT_URI: string;
  HMRC_CLIENT_ID: string;
  HMRC_CLIENT_SECRET: string;
  HMRC_REDIRECT_URI?: string;
  ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  APP_URL?: string;
  HEALTH_CHECK_TOKEN?: string;
  SENTRY_DSN?: string;
  TRUELAYER_SANDBOX?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_ANNUAL?: string;
}

type AuthedEnv = { Bindings: Env; Variables: { userId: string; userEmail?: string } };

function getTrueLayerConfig(env: Env): TrueLayerConfig {
  return {
    clientId: env.TRUELAYER_CLIENT_ID,
    clientSecret: env.TRUELAYER_CLIENT_SECRET,
    redirectUri: env.TRUELAYER_REDIRECT_URI,
    encryptionKey: env.ENCRYPTION_KEY,
    // Explicit opt-in. If TRUELAYER_SANDBOX is unset, default to sandbox=false
    // (safer than inferring from ENVIRONMENT which could be misconfigured).
    sandbox: env.TRUELAYER_SANDBOX === 'true',
  };
}

const app = new Hono<AuthedEnv>();

// ─── Startup validation ──────────────────────────────────
// Fail fast with a clear error if required secrets are missing, rather
// than crashing mid-request with `undefined.replace is not a function`.
function validateEnv(env: Env): void {
  const required: Array<keyof Env> = [
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'ENCRYPTION_KEY',
    'TRUELAYER_CLIENT_ID',
    'TRUELAYER_CLIENT_SECRET',
    'TRUELAYER_REDIRECT_URI',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'ANTHROPIC_API_KEY',
  ];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  if (env.ENCRYPTION_KEY.length < 64) {
    throw new Error('ENCRYPTION_KEY must be at least 64 hex characters');
  }
}

let envValidated = false;
app.use('*', async (c, next) => {
  if (!envValidated) {
    try {
      validateEnv(c.env);
      envValidated = true;
    } catch (err) {
      console.error('[Worker startup]', err);
      return c.json({ error: { code: 'CONFIG_ERROR', message: 'Server misconfigured' } }, 500);
    }
  }
  await next();
});

// ─── Global Middleware ────────────────────────────────────
// ─── Helper: categorise and save results to D1 ─────────
async function categoriseAndSave(
  db: D1Database,
  uncategorised: { id: string; amount: number; description: string; merchant_name: string | null }[],
  userId: string,
  anthropicApiKey: string,
) {
  const corrections = await query<{ merchant_name: string; corrected_category: string }>(
    db,
    'SELECT DISTINCT merchant_name, corrected_category FROM category_corrections WHERE user_id = ? AND merchant_name IS NOT NULL LIMIT 20',
    [userId],
  );

  const results = await categoriseTransactions(
    uncategorised.map((tx) => ({ id: tx.id, amount: tx.amount, description: tx.description, merchantName: tx.merchant_name })),
    anthropicApiKey,
    corrections.map((c) => ({ merchantName: c.merchant_name, category: c.corrected_category })),
  );

  if (results.length > 0) {
    await db.batch(
      results.map((r) =>
        db.prepare('UPDATE transactions SET ai_category = ?, ai_confidence = ?, ai_reasoning = ?, is_income = ?, is_expense_claimable = ?, income_source = ? WHERE id = ? AND user_id = ?')
          .bind(r.category, r.confidence, r.reasoning, r.category === 'income' ? 1 : 0, r.category === 'business_expense' ? 1 : 0, r.incomeSourceType, r.id, userId)
      )
    );
  }

  return results.length;
}

app.use('*', logger((str) => {
  console.log(str.replace(/([?&]code=)[^&\s]+/g, '$1[REDACTED]').replace(/([?&]state=)[^&\s]+/g, '$1[REDACTED]'));
}));
app.use(
  '*',
  cors({
    origin: (origin: string, c: { env: Env }) => {
      const isProd = c.env.ENVIRONMENT === 'production';
      const allowed = isProd
        ? ['https://quidsafe.uk', 'https://app.quidsafe.uk']
        : ['http://localhost:8081', 'http://127.0.0.1:4173', 'https://quidsafe.uk', 'https://app.quidsafe.uk'];
      // Pages preview deployments only allowed against non-production API
      if (allowed.includes(origin)) return origin;
      if (!isProd && /^https:\/\/[a-z0-9-]+\.quidsafe\.pages\.dev$/.test(origin)) return origin;
      return '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Prevent caching of authenticated API responses (financial data)
  if (!c.req.path.startsWith('/health') && !c.req.path.startsWith('/articles')) {
    c.header('Cache-Control', 'no-store, private');
  }
});
app.use('*', rateLimit());

// ─── Public Routes ────────────────────────────────────────

app.get('/health', (c) => {
  // Minimal health response - don't leak environment/version to recon scans
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check - checks all critical dependencies.
// Protected by HEALTH_CHECK_TOKEN secret to avoid leaking infra state publicly.
app.get('/health/detailed', async (c) => {
  const authHeader = c.req.header('Authorization');
  const expected = c.env.HEALTH_CHECK_TOKEN;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  const started = Date.now();

  // D1 check - simple query
  try {
    const t = Date.now();
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = { ok: true, latencyMs: Date.now() - t };
  } catch (err) {
    checks.database = { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }

  // Clerk JWKS reachability
  try {
    const keyPart = c.env.CLERK_PUBLISHABLE_KEY.replace(/^pk_(test|live)_/, '');
    const clerkDomain = atob(keyPart).replace(/\$$/, '');
    const t = Date.now();
    const r = await fetch(`https://${clerkDomain}/.well-known/jwks.json`);
    checks.clerk = { ok: r.ok, latencyMs: Date.now() - t };
  } catch (err) {
    checks.clerk = { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return c.json({
    status: allOk ? 'ok' : 'degraded',
    totalMs: Date.now() - started,
    checks,
  }, allOk ? 200 : 503);
});

app.post('/webhooks/stripe', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400);
  }

  const valid = await verifyWebhookSignature(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  await handleWebhookEvent(event, c.env.DB);
  return c.json({ received: true });
});

// ─── Public Article Routes ───────────────────────────────

app.get('/articles', async (c) => {
  const articles = await query(c.env.DB, 'SELECT id, title, summary, category, read_time_min, published_at FROM articles ORDER BY published_at DESC');
  return c.json({ articles: articles ?? [] });
});

app.get('/articles/:id', async (c) => {
  const article = await queryOne(c.env.DB, 'SELECT * FROM articles WHERE id = ?', [c.req.param('id')]);
  if (!article) return c.json({ error: 'Not found' }, 404);
  return c.json({ article });
});

// ─── Public Banking OAuth Callback ───────────────────────
// TrueLayer redirects here - no JWT available, uses oauth_state for user identification
app.get('/banking/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const oauthError = c.req.query('error');

  // Handle OAuth denial / error from provider
  if (oauthError || !code) {
    let isNative = false;
    if (state) {
      // Validate state against DB before using it - prevents CSRF bypass on error path
      const validState = await queryOne<{ user_id: string }>(
        c.env.DB,
        'SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime(\'now\', \'-10 minutes\')',
        [state],
      );
      if (validState) {
        isNative = state.endsWith('_native');
        await execute(c.env.DB, 'DELETE FROM oauth_states WHERE state = ?', [state]);
      }
    }
    if (isNative) {
      return c.redirect('quidsafe://banking/callback?error=denied');
    }
    const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
    return c.redirect(`${appUrl}/(tabs)?bankError=denied`);
  }
  if (!state) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Missing state parameter' } }, 400);
  }

  // Validate OAuth state to identify user and prevent CSRF
  const oauthState = await queryOne<{ user_id: string }>(
    c.env.DB,
    'SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime(\'now\', \'-10 minutes\')',
    [state],
  );
  if (!oauthState) {
    return c.json({ error: { code: 'INVALID_STATE', message: 'Invalid or expired OAuth state' } }, 403);
  }
  const userId = oauthState.user_id;
  const isNative = state.endsWith('_native');

  try {
    const config = getTrueLayerConfig(c.env);
    const tokens = await exchangeCode(code, config);
    const encrypted = await encryptTokens(tokens, c.env.ENCRYPTION_KEY);
    const bankName = await detectBankName(tokens.access_token, config);

    const connectionId = crypto.randomUUID();
    await execute(
      c.env.DB,
      'INSERT INTO bank_connections (id, user_id, bank_name, access_token_encrypted, refresh_token_encrypted) VALUES (?, ?, ?, ?, ?)',
      [connectionId, userId, bankName, encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted],
    );

    // Delete state only after successful exchange and storage
    await execute(c.env.DB, 'DELETE FROM oauth_states WHERE state = ?', [state]);

    const connection: BankConnectionRow = {
      id: connectionId,
      user_id: userId,
      bank_name: bankName,
      access_token_encrypted: encrypted.accessTokenEncrypted,
      refresh_token_encrypted: encrypted.refreshTokenEncrypted,
      last_synced_at: null,
      active: 1,
    };

    try {
      const result = await syncTransactions(c.env.DB, connection, config);
      if (result.synced > 0) {
        try {
          const uncategorised = await query<{ id: string; amount: number; description: string; merchant_name: string }>(
            c.env.DB,
            'SELECT id, amount, description, merchant_name FROM transactions WHERE user_id = ? AND ai_category IS NULL',
            [userId],
          );
          if (uncategorised.length > 0) {
            await categoriseAndSave(c.env.DB, uncategorised, userId, c.env.ANTHROPIC_API_KEY);
          }
        } catch (catErr) {
          console.error('Auto-categorisation after connect failed:', catErr);
        }
      }
      if (isNative) {
        return c.redirect('quidsafe://banking/callback?success=true');
      }
      const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
      return c.redirect(`${appUrl}/(tabs)?bankConnected=true`);
    } catch (err) {
      console.error('Initial sync failed:', err);
      if (isNative) {
        return c.redirect('quidsafe://banking/callback?success=true&syncError=true');
      }
      const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
      return c.redirect(`${appUrl}/(tabs)?bankConnected=true&syncError=true`);
    }
  } catch (err) {
    console.error('Banking token exchange failed:', err);
    // State is NOT deleted - allows retry within the 10-minute TTL
    if (isNative) {
      return c.redirect('quidsafe://banking/callback?error=exchange_failed');
    }
    const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
    return c.redirect(`${appUrl}/(tabs)?bankError=exchange_failed`);
  }
});

// ─── Public HMRC OAuth Callback ──────────────────────────
// HMRC redirects here - no JWT available, uses oauth_state for user identification
app.get('/mtd/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const oauthError = c.req.query('error');

  // Handle OAuth denial / error from provider
  if (oauthError || !code) {
    let isNative = false;
    if (state) {
      // Validate state against DB before using it - prevents CSRF bypass on error path
      const validState = await queryOne<{ user_id: string }>(
        c.env.DB,
        'SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime(\'now\', \'-10 minutes\')',
        [state],
      );
      if (validState) {
        isNative = state.endsWith('_native');
        await execute(c.env.DB, 'DELETE FROM oauth_states WHERE state = ?', [state]);
      }
    }
    if (isNative) {
      return c.redirect('quidsafe://hmrc/callback?error=denied');
    }
    const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
    return c.redirect(`${appUrl}/mtd?hmrcError=denied`);
  }
  if (!state) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Missing state parameter' } }, 400);
  }

  // Validate OAuth state to identify user and prevent CSRF
  const oauthState = await queryOne<{ user_id: string }>(
    c.env.DB,
    'SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime(\'now\', \'-10 minutes\')',
    [state],
  );
  if (!oauthState) {
    return c.json({ error: { code: 'INVALID_STATE', message: 'Invalid or expired OAuth state' } }, 403);
  }
  const userId = oauthState.user_id;
  const isNative = state.endsWith('_native');

  try {
    const config = getHmrcConfig(c.env);
    const tokens = await exchangeHmrcCode(code, config);
    const encrypted = await encryptTokens(
      { access_token: tokens.accessToken, refresh_token: tokens.refreshToken, expires_in: tokens.expiresIn, token_type: 'bearer' },
      c.env.ENCRYPTION_KEY,
    );

    await execute(c.env.DB,
      'INSERT INTO bank_connections (id, user_id, provider, bank_name, access_token_encrypted, refresh_token_encrypted) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, 'hmrc', 'HMRC', encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted],
    );

    // Delete state only after successful exchange and storage
    await execute(c.env.DB, 'DELETE FROM oauth_states WHERE state = ?', [state]);

    if (isNative) {
      return c.redirect('quidsafe://hmrc/callback?success=true');
    }
    const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
    return c.redirect(`${appUrl}/mtd?hmrcConnected=true`);
  } catch (err) {
    console.error('HMRC token exchange failed:', err);
    // State is NOT deleted - allows retry within the 10-minute TTL
    if (isNative) {
      return c.redirect('quidsafe://hmrc/callback?error=exchange_failed');
    }
    const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
    return c.redirect(`${appUrl}/mtd?hmrcError=exchange_failed`);
  }
});

// ─── Auth-Protected Routes ────────────────────────────────
// All routes below require a valid Clerk JWT

const authed = new Hono<AuthedEnv>();
authed.use('*', clerkAuth());

// ─── Subscription Guard Middleware ───────────────────────
// Blocks routes when trial has expired or subscription is cancelled.
// Returns 402 for paywall enforcement.
async function requireActiveSubscription(c: Context<AuthedEnv>, next: Next) {
  const userId = c.get('userId');
  const user = await queryOne<{ subscription_tier: string; grace_period_ends: string | null }>(
    c.env.DB,
    'SELECT subscription_tier, grace_period_ends FROM users WHERE id = ?',
    [userId],
  );

  if (!user) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  const tier = user.subscription_tier;

  // Allow pro and past_due (still in grace period) users through
  if (tier === 'pro' || tier === 'past_due') {
    return next();
  }

  // For trialing/cancelled users, check if they have an active trial
  if (tier === 'trialing' || tier === 'cancelled') {
    const sub = await queryOne<{ status: string; trial_ends_at: string | null }>(
      c.env.DB,
      'SELECT status, trial_ends_at FROM subscriptions WHERE user_id = ?',
      [userId],
    );

    // Allow if still trialing
    if (sub?.status === 'trialing' && sub.trial_ends_at) {
      const trialEnd = new Date(sub.trial_ends_at);
      if (trialEnd > new Date()) {
        return next();
      }
    }

    return c.json(
      { error: { code: 'SUBSCRIPTION_REQUIRED', message: 'Active subscription required' } },
      402,
    );
  }

  // Default: block access
  return c.json(
    { error: { code: 'SUBSCRIPTION_REQUIRED', message: 'Active subscription required' } },
    402,
  );
}

// ─── Paid Subscription Guard ─────────────────────────────
// Stricter than requireActiveSubscription: blocks trialing users too.
// Applied to high-value extraction features (MTD submissions, invoice
// email) to prevent trial abuse - sign up, submit taxes, cancel.
async function requirePaidSubscription(c: Context<AuthedEnv>, next: Next) {
  const userId = c.get('userId');
  const user = await queryOne<{ subscription_tier: string }>(
    c.env.DB,
    'SELECT subscription_tier FROM users WHERE id = ?',
    [userId],
  );

  if (!user) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  // Only paid tiers get through. Trialing, cancelled, past_due all blocked.
  // past_due = grace period, they must reactivate before extracting value.
  if (user.subscription_tier === 'pro') {
    return next();
  }

  return c.json(
    {
      error: {
        code: 'PAID_SUBSCRIPTION_REQUIRED',
        message: 'This feature requires an active paid subscription. Upgrade from your trial to unlock.',
      },
    },
    402,
  );
}

// Apply ACTIVE subscription guard (trial OK) to write-sensitive routes
authed.post('/banking/sync/:id', requireActiveSubscription);
authed.post('/transactions/categorise', requireActiveSubscription);
authed.get('/mtd/auth', requireActiveSubscription);
authed.post('/mtd/callback', requireActiveSubscription);
authed.get('/mtd/obligations', requireActiveSubscription);
authed.get('/mtd/submission/:id', requireActiveSubscription);

// Apply PAID subscription guard (trial BLOCKED) to value-extraction routes
authed.post('/mtd/submit-quarterly', requirePaidSubscription);
authed.post('/invoices/:id/send', requirePaidSubscription);

// ── Auth ──────────────────────────────────────────────────
authed.post('/auth/signup', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = signupSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  await execute(c.env.DB, 'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)', [
    userId,
    body.email,
    body.name ?? '',
  ]);

  const user = await queryOne(c.env.DB, 'SELECT id, email, name, subscription_tier, onboarding_completed, stripe_customer_id, grace_period_ends, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, created_at, updated_at FROM users WHERE id = ?', [userId]);
  return c.json({ user });
});

authed.post('/auth/session', async (c) => {
  const userId = c.get('userId');
  const user = await queryOne(c.env.DB, 'SELECT id, email, name, subscription_tier, onboarding_completed, stripe_customer_id, grace_period_ends, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, created_at, updated_at FROM users WHERE id = ?', [userId]);

  if (!user) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  return c.json({ user });
});

authed.put('/auth/onboarding', async (c) => {
  const userId = c.get('userId');
  await execute(c.env.DB, 'UPDATE users SET onboarding_completed = 1, updated_at = datetime(\'now\') WHERE id = ?', [userId]);
  return c.json({ success: true });
});

authed.delete('/auth/account', async (c) => {
  const userId = c.get('userId');
  // CASCADE delete will remove all user data (transactions, bank_connections, etc.)
  await execute(c.env.DB, 'DELETE FROM users WHERE id = ?', [userId]);
  return c.json({ deleted: true });
});

// ── Dashboard ─────────────────────────────────────────────
authed.get('/dashboard', async (c) => {
  const userId = c.get('userId');
  const { taxYear, quarter } = getCurrentQuarter();

  const taxYearStart = `${taxYear.split('/')[0]}-04-06`;

  const [
    user,
    incomeResult,
    expenseResult,
    incomeBySrc,
    uncatCount,
    bankCount,
    overdueInvoices,
    byMonthRows,
  ] = await Promise.all([
    queryOne<{ name: string; subscription_tier: string }>(
      c.env.DB,
      'SELECT name, subscription_tier FROM users WHERE id = ?',
      [userId],
    ),
    queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ?',
      [userId, taxYearStart],
    ),
    queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ?',
      [userId, taxYearStart],
    ),
    query<{ income_source: string; total: number }>(
      c.env.DB,
      'SELECT COALESCE(income_source, \'Other\') as income_source, SUM(amount) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ? GROUP BY income_source ORDER BY total DESC',
      [userId, taxYearStart],
    ),
    queryOne<{ count: number }>(
      c.env.DB,
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND (ai_category IS NULL OR ai_confidence < 0.6)',
      [userId],
    ),
    queryOne<{ count: number }>(
      c.env.DB,
      'SELECT COUNT(*) as count FROM bank_connections WHERE user_id = ? AND active = 1',
      [userId],
    ),
    queryOne<{ count: number }>(
      c.env.DB,
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = ? AND due_date < date(\'now\')',
      [userId, 'sent'],
    ),
    query<{ month: string; income: number }>(
      c.env.DB,
      'SELECT strftime(\'%Y-%m\', transaction_date) as month, SUM(amount) as income FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= date(\'now\', \'-12 months\') GROUP BY month ORDER BY month',
      [userId],
    ),
  ]);

  const totalIncome = incomeResult?.total ?? 0;
  const totalExpenses = expenseResult?.total ?? 0;
  const tax = calculateTax({ totalIncome, totalExpenses, quarter, taxYear });

  const bySource = incomeBySrc.map((s) => ({
    name: s.income_source,
    amount: s.total,
    percentage: totalIncome > 0 ? Math.round((s.total / totalIncome) * 100) : 0,
  }));

  const byMonth = byMonthRows.map((r) => ({ month: r.month, income: r.income }));

  // Compute dynamic action items
  const actions: { id: string; type: string; title: string; subtitle: string; priority: number }[] = [];

  if (uncatCount && uncatCount.count > 0) {
    actions.push({
      id: 'review_transactions',
      type: 'warning',
      title: `${uncatCount.count} transaction${uncatCount.count === 1 ? '' : 's'} need${uncatCount.count === 1 ? 's' : ''} review`,
      subtitle: 'Categorise them to improve your tax estimate',
      priority: 1,
    });
  }

  if (!bankCount || bankCount.count === 0) {
    actions.push({
      id: 'connect_bank',
      type: 'info',
      title: 'Connect your bank account',
      subtitle: 'Automatically import transactions for tax tracking',
      priority: 2,
    });
  }

  if (overdueInvoices && overdueInvoices.count > 0) {
    actions.push({
      id: 'overdue_invoices',
      type: 'warning',
      title: `${overdueInvoices.count} overdue invoice${overdueInvoices.count === 1 ? '' : 's'}`,
      subtitle: 'Follow up on unpaid invoices',
      priority: 1,
    });
  }

  // Quarterly payment deadline reminder
  const quarterDates = getQuarterDates(taxYear);
  const now = new Date();
  for (const qd of quarterDates) {
    const deadline = new Date(qd.deadline);
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 30) {
      actions.push({
        id: `deadline_q${qd.quarter}`,
        type: 'urgent',
        title: `Q${qd.quarter} payment due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        subtitle: `Deadline: ${qd.deadline}`,
        priority: 0,
      });
      break; // Only show the nearest deadline
    }
  }

  actions.sort((a, b) => a.priority - b.priority);

  return c.json({
    user: { name: user?.name ?? '', subscriptionTier: user?.subscription_tier ?? 'trialing' },
    tax,
    income: { total: totalIncome, bySource, byMonth },
    quarters: { current: { taxYear, quarter } },
    actions,
  });
});

// ── Quarterly Breakdown ──────────────────────────────────
authed.get('/tax/quarters', async (c) => {
  const userId = c.get('userId');
  const taxYearParam = c.req.query('taxYear');
  if (taxYearParam && !/^\d{4}\/\d{2}$/.test(taxYearParam)) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid taxYear format' } }, 400);
  }
  const taxYear = taxYearParam ?? getCurrentQuarter().taxYear;
  const quarters = getQuarterDates(taxYear);

  const populated = await Promise.all(
    quarters.map(async (q) => {
      const [income, expenses] = await Promise.all([
        queryOne<{ total: number }>(
          c.env.DB,
          'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ? AND transaction_date <= ?',
          [userId, q.startDate, q.endDate],
        ),
        queryOne<{ total: number }>(
          c.env.DB,
          'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ? AND transaction_date <= ?',
          [userId, q.startDate, q.endDate],
        ),
      ]);

      const qIncome = income?.total ?? 0;
      const qExpenses = expenses?.total ?? 0;
      const taxResult = calculateTax({ totalIncome: qIncome, totalExpenses: qExpenses, quarter: q.quarter, taxYear });

      return {
        ...q,
        income: qIncome,
        expenses: qExpenses,
        tax: taxResult.totalTaxOwed,
        setAsideMonthly: taxResult.setAsideMonthly,
      };
    }),
  );

  // Full year totals
  const yearIncome = populated.reduce((sum, q) => sum + q.income, 0);
  const yearExpenses = populated.reduce((sum, q) => sum + q.expenses, 0);
  const yearTax = calculateTax({ totalIncome: yearIncome, totalExpenses: yearExpenses, taxYear });

  return c.json({
    taxYear,
    quarters: populated,
    yearTotal: {
      income: yearIncome,
      expenses: yearExpenses,
      totalTaxOwed: yearTax.totalTaxOwed,
      effectiveRate: yearTax.effectiveRate,
      setAsideMonthly: yearTax.setAsideMonthly,
      plainEnglish: yearTax.plainEnglish,
    },
  });
});

// ── Transactions ──────────────────────────────────────────
authed.get('/transactions', async (c) => {
  const userId = c.get('userId');
  const rawLimit = parseInt(c.req.query('limit') ?? '50', 10);
  const rawOffset = parseInt(c.req.query('offset') ?? '0', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  const category = c.req.query('category');

  let sql = 'SELECT id, amount, description, merchant_name, ai_category, ai_confidence, is_income, is_expense_claimable, income_source, transaction_date, bank_connection_id, user_override, created_at FROM transactions WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (category) {
    sql += ' AND ai_category = ?';
    params.push(category);
  }

  sql += ' ORDER BY transaction_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const transactions = await query(c.env.DB, sql, params);
  const countResult = await queryOne<{ count: number }>(
    c.env.DB,
    'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
    [userId],
  );

  return c.json({ transactions, total: countResult?.count ?? 0, limit, offset });
});

authed.post('/transactions/categorise', async (c) => {
  const userId = c.get('userId');

  // Get uncategorised transactions
  const uncategorised = await query<{
    id: string;
    amount: number;
    description: string;
    merchant_name: string | null;
  }>(
    c.env.DB,
    'SELECT id, amount, description, merchant_name FROM transactions WHERE user_id = ? AND ai_category IS NULL LIMIT 200',
    [userId],
  );

  if (uncategorised.length === 0) {
    return c.json({ categorised: 0, message: 'No uncategorised transactions' });
  }

  // Load user corrections for few-shot examples
  const corrections = await query<{
    merchant_name: string;
    corrected_category: string;
  }>(
    c.env.DB,
    'SELECT DISTINCT merchant_name, corrected_category FROM category_corrections WHERE user_id = ? AND merchant_name IS NOT NULL LIMIT 20',
    [userId],
  );

  const results = await categoriseTransactions(
    uncategorised.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      description: tx.description,
      merchantName: tx.merchant_name,
    })),
    c.env.ANTHROPIC_API_KEY,
    corrections.map((c) => ({ merchantName: c.merchant_name, category: c.corrected_category })),
  );

  // Write results to D1 with confidence thresholds
  let autoAccepted = 0;
  let flagged = 0;
  let uncategorisedCount = 0;

  for (const result of results) {
    let isExpenseClaimable = 0;
    if (result.category === 'business_expense') isExpenseClaimable = 1;

    await execute(
      c.env.DB,
      'UPDATE transactions SET ai_category = ?, ai_confidence = ?, ai_reasoning = ?, is_income = ?, is_expense_claimable = ?, income_source = ? WHERE id = ? AND user_id = ?',
      [
        result.category,
        result.confidence,
        result.reasoning,
        result.category === 'income' ? 1 : 0,
        isExpenseClaimable,
        result.incomeSourceType,
        result.id,
        userId,
      ],
    );

    if (result.confidence >= 0.85) autoAccepted++;
    else if (result.confidence >= 0.60) flagged++;
    else uncategorisedCount++;
  }

  return c.json({
    categorised: results.length,
    autoAccepted,
    flaggedForReview: flagged,
    uncategorised: uncategorisedCount,
  });
});

authed.get('/transactions/uncategorised', async (c) => {
  const userId = c.get('userId');
  const transactions = await query(
    c.env.DB,
    'SELECT id, amount, description, merchant_name, ai_category, ai_confidence, is_income, income_source, transaction_date, user_override FROM transactions WHERE user_id = ? AND (ai_category IS NULL OR ai_confidence < 0.60) ORDER BY transaction_date DESC',
    [userId],
  );
  return c.json({ transactions });
});

authed.put('/transactions/:id/category', async (c) => {
  const userId = c.get('userId');
  const txId = c.req.param('id');
  const raw = await c.req.json();
  const result = updateTransactionCategorySchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  // Get original for correction tracking
  const original = await queryOne<{ ai_category: string; merchant_name: string }>(
    c.env.DB,
    'SELECT ai_category, merchant_name FROM transactions WHERE id = ? AND user_id = ?',
    [txId, userId],
  );

  if (!original) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, 404);
  }

  // Update transaction
  await execute(
    c.env.DB,
    'UPDATE transactions SET ai_category = ?, user_override = 1, is_income = ?, income_source = ? WHERE id = ? AND user_id = ?',
    [body.category, body.category === 'income' ? 1 : 0, body.incomeSource ?? null, txId, userId],
  );

  // Record correction for AI learning
  if (original.ai_category && original.ai_category !== body.category) {
    await execute(
      c.env.DB,
      'INSERT INTO category_corrections (user_id, transaction_id, original_category, corrected_category, merchant_name) VALUES (?, ?, ?, ?, ?)',
      [userId, txId, original.ai_category, body.category, original.merchant_name],
    );
  }

  return c.json({ success: true });
});

// ── Banking ───────────────────────────────────────────────
authed.get('/banking/connect', async (c) => {
  const userId = c.get('userId');

  // Enforce multi-bank limit: 3 accounts for all users
  const activeConns = await query(
    c.env.DB,
    'SELECT id FROM bank_connections WHERE user_id = ? AND active = 1',
    [userId],
  );
  if (activeConns.length >= 3) {
    return c.json(
      { error: { code: 'BANK_LIMIT_REACHED', message: 'You can connect up to 3 bank accounts' } },
      403,
    );
  }

  const config = getTrueLayerConfig(c.env);
  const platform = c.req.query('platform'); // 'native' for mobile apps

  // Generate cryptographically random state and store with short TTL
  // Encode platform in state so the callback knows where to redirect
  const stateId = crypto.randomUUID();
  const state = platform === 'native' ? `${stateId}_native` : stateId;
  await execute(
    c.env.DB,
    'INSERT INTO oauth_states (state, user_id, created_at) VALUES (?, ?, datetime(\'now\'))',
    [state, userId],
  );

  const url = getConnectUrl(config, state);
  return c.json({ url });
});

// Banking callback moved to public routes (above) - TrueLayer redirects without JWT

authed.get('/banking/connections', async (c) => {
  const userId = c.get('userId');
  const connections = await query(
    c.env.DB,
    `SELECT bc.id, bc.bank_name, bc.last_synced_at, bc.active, bc.created_at,
            (SELECT COUNT(*) FROM transactions WHERE bank_connection_id = bc.id) as transaction_count
     FROM bank_connections bc
     WHERE bc.user_id = ? AND bc.active = 1`,
    [userId],
  );
  return c.json({ connections });
});

authed.post('/banking/sync/:id', async (c) => {
  const userId = c.get('userId');
  const connId = c.req.param('id');

  const connection = await queryOne<BankConnectionRow>(
    c.env.DB,
    'SELECT id, user_id, bank_name, access_token_encrypted, refresh_token_encrypted, last_synced_at, active FROM bank_connections WHERE id = ? AND user_id = ? AND active = 1',
    [connId, userId],
  );

  if (!connection) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Bank connection not found' } }, 404);
  }

  const config = getTrueLayerConfig(c.env);

  try {
    const result = await syncTransactions(c.env.DB, connection, config);
    return c.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    if (message === 'BANK_CONNECTION_EXPIRED') {
      return c.json({ error: { code: 'BANK_CONNECTION_EXPIRED', message: 'Bank connection expired - please reconnect' } }, 401);
    }
    return c.json({ error: { code: 'SYNC_ERROR', message: 'Transaction sync failed' } }, 500);
  }
});

authed.delete('/banking/connections/:id', async (c) => {
  const userId = c.get('userId');
  const connId = c.req.param('id');
  await execute(
    c.env.DB,
    'UPDATE bank_connections SET active = 0 WHERE id = ? AND user_id = ?',
    [connId, userId],
  );
  await audit(c.env.DB, {
    userId, action: 'bank.disconnect', entityType: 'bank_connection', entityId: connId,
    ...auditContext(c.req.raw.headers),
  });
  return c.json({ disconnected: true });
});

// ── Tax ───────────────────────────────────────────────────
authed.get('/tax/calculation', async (c) => {
  const userId = c.get('userId');
  const { taxYear, quarter } = getCurrentQuarter();

  const startDate = `${taxYear.split('/')[0]}-04-06`;
  const [incomeResult, expenseResult] = await Promise.all([
    queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ?',
      [userId, startDate],
    ),
    queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ?',
      [userId, startDate],
    ),
  ]);

  const result = calculateTax({
    totalIncome: incomeResult?.total ?? 0,
    totalExpenses: expenseResult?.total ?? 0,
    quarter,
    taxYear,
  });

  return c.json(result);
});

// ── Expenses ──────────────────────────────────────────────
authed.get('/expenses', async (c) => {
  const userId = c.get('userId');
  const expenses = await query(c.env.DB, 'SELECT id, amount, description, hmrc_category, date, receipt_url, created_at FROM expenses WHERE user_id = ? ORDER BY date DESC', [userId]);
  return c.json({ expenses });
});

authed.post('/expenses', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = createExpenseSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;
  const id = crypto.randomUUID();

  await execute(
    c.env.DB,
    'INSERT INTO expenses (id, user_id, amount, description, category_id, hmrc_category, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, body.amount, body.description, body.categoryId ?? null, body.hmrcCategory ?? null, body.date],
  );

  return c.json({ id, success: true }, 201);
});

authed.put('/expenses/:id', async (c) => {
  const userId = c.get('userId');
  const expenseId = c.req.param('id');
  const raw = await c.req.json();
  const result = updateExpenseSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.amount !== undefined) { updates.push('amount = ?'); params.push(body.amount); }
  if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
  if (body.date !== undefined) { updates.push('date = ?'); params.push(body.date); }
  if (body.hmrcCategory !== undefined) { updates.push('hmrc_category = ?'); params.push(body.hmrcCategory); }

  if (updates.length === 0) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } }, 400);
  }

  params.push(expenseId, userId);
  await execute(
    c.env.DB,
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
  );

  const updated = await query(c.env.DB, 'SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
  if (!updated.length) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404);
  }

  return c.json({ expense: updated[0], success: true });
});

authed.delete('/expenses/:id', async (c) => {
  const userId = c.get('userId');
  await execute(c.env.DB, 'DELETE FROM expenses WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
  return c.json({ deleted: true });
});

// ── Recurring Expenses ──────────────────────────────────
authed.get('/expenses/recurring', async (c) => {
  const userId = c.get('userId');
  const recurringExpenses = await query(
    c.env.DB,
    'SELECT id, amount, description, hmrc_category, frequency, next_due_date, active, created_at FROM recurring_expenses WHERE user_id = ? AND active = 1 ORDER BY next_due_date ASC',
    [userId],
  );
  return c.json({ recurringExpenses });
});

authed.post('/expenses/recurring', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = createRecurringExpenseSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  const id = crypto.randomUUID();
  await execute(
    c.env.DB,
    'INSERT INTO recurring_expenses (id, user_id, amount, description, hmrc_category, frequency, start_date, next_due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, body.amount, body.description, body.hmrcCategory ?? 'other', body.frequency, body.startDate, body.startDate],
  );

  return c.json({ id, success: true }, 201);
});

authed.put('/expenses/recurring/:id', async (c) => {
  const userId = c.get('userId');
  const recId = c.req.param('id');
  const raw = await c.req.json();
  const result = updateRecurringExpenseSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.amount !== undefined) { updates.push('amount = ?'); params.push(body.amount); }
  if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
  if (body.hmrcCategory !== undefined) { updates.push('hmrc_category = ?'); params.push(body.hmrcCategory); }
  if (body.frequency !== undefined) { updates.push('frequency = ?'); params.push(body.frequency); }
  if (body.active !== undefined) { updates.push('active = ?'); params.push(body.active ? 1 : 0); }

  if (updates.length === 0) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } }, 400);
  }

  params.push(recId, userId);
  await execute(
    c.env.DB,
    `UPDATE recurring_expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
  );

  return c.json({ success: true });
});

authed.delete('/expenses/recurring/:id', async (c) => {
  const userId = c.get('userId');
  const recId = c.req.param('id');
  await execute(
    c.env.DB,
    'UPDATE recurring_expenses SET active = 0 WHERE id = ? AND user_id = ?',
    [recId, userId],
  );
  return c.json({ deleted: true });
});

// ── Invoices ──────────────────────────────────────────────
authed.get('/invoices', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  let sql = 'SELECT id, client_name, description, amount, due_date, status, paid_at, created_at FROM invoices WHERE user_id = ?';
  const params: unknown[] = [userId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const invoices = await query(c.env.DB, sql, params);
  return c.json({ invoices });
});

authed.post('/invoices', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = createInvoiceSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;
  const id = crypto.randomUUID();

  await execute(
    c.env.DB,
    'INSERT INTO invoices (id, user_id, client_name, client_email, amount, description, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, body.clientName, body.clientEmail ?? null, body.amount, body.description, body.dueDate],
  );

  await audit(c.env.DB, {
    userId, action: 'invoice.create', entityType: 'invoice', entityId: id,
    metadata: { amount: body.amount, clientName: body.clientName },
    ...auditContext(c.req.raw.headers),
  });

  return c.json({ id, success: true }, 201);
});

authed.put('/invoices/:id', async (c) => {
  const userId = c.get('userId');
  const invoiceId = c.req.param('id');
  const raw = await c.req.json();
  const result = updateInvoiceSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  // Build dynamic update
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.status) { updates.push('status = ?'); params.push(body.status); }
  if (body.clientName) { updates.push('client_name = ?'); params.push(body.clientName); }
  if (body.clientEmail !== undefined) { updates.push('client_email = ?'); params.push(body.clientEmail); }
  if (body.amount) { updates.push('amount = ?'); params.push(body.amount); }
  if (body.description) { updates.push('description = ?'); params.push(body.description); }
  if (body.dueDate) { updates.push('due_date = ?'); params.push(body.dueDate); }
  if (body.status === 'paid') { updates.push("paid_at = datetime('now')"); }

  if (updates.length === 0) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } }, 400);
  }

  params.push(invoiceId, userId);
  await execute(
    c.env.DB,
    `UPDATE invoices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
  );

  return c.json({ success: true });
});

authed.delete('/invoices/:id', async (c) => {
  const userId = c.get('userId');
  const invoiceId = c.req.param('id');
  await execute(
    c.env.DB,
    'DELETE FROM invoices WHERE id = ? AND user_id = ?',
    [invoiceId, userId],
  );
  return c.json({ deleted: true });
});

// Send invoice via email
authed.post('/invoices/:id/send', async (c) => {
  const userId = c.get('userId');
  const invoiceId = c.req.param('id');
  const raw = await c.req.json();
  const result = sendInvoiceEmailSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }

  // Fetch invoice and verify ownership
  const invoice = await queryOne<{
    id: string; user_id: string; client_name: string; client_email: string | null;
    amount: number; description: string; due_date: string; status: string;
  }>(
    c.env.DB,
    'SELECT id, user_id, client_name, client_email, amount, description, due_date, status FROM invoices WHERE id = ? AND user_id = ?',
    [invoiceId, userId],
  );

  if (!invoice) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404);
  }

  if (invoice.status === 'paid') {
    return c.json({ error: { code: 'ALREADY_PAID', message: 'Cannot send a paid invoice' } }, 400);
  }

  // Get sender name
  const user = await queryOne<{ name: string | null }>(
    c.env.DB,
    'SELECT name FROM users WHERE id = ?',
    [userId],
  );
  const senderName = user?.name || 'A QuidSafe user';

  const emailResult = await sendInvoiceEmail(
    {
      clientName: invoice.client_name,
      clientEmail: result.data.recipientEmail,
      amount: invoice.amount,
      description: invoice.description,
      dueDate: invoice.due_date,
      invoiceId: invoice.id,
      senderName,
    },
    { apiKey: c.env.RESEND_API_KEY, fromEmail: c.env.FROM_EMAIL },
  );

  if (!emailResult.success) {
    return c.json({ error: { code: 'EMAIL_FAILED', message: 'Failed to send email' } }, 500);
  }

  // Update status to 'sent' and store recipient email
  await execute(
    c.env.DB,
    "UPDATE invoices SET status = 'sent', client_email = ? WHERE id = ? AND user_id = ?",
    [result.data.recipientEmail, invoiceId, userId],
  );

  return c.json({ success: true });
});

// ── Billing ──────────────────────────────────────────────
authed.post('/billing/checkout', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = checkoutSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;
  const config = {
    secretKey: c.env.STRIPE_SECRET_KEY,
    webhookSecret: c.env.STRIPE_WEBHOOK_SECRET,
    priceMonthly: c.env.STRIPE_PRICE_MONTHLY,
    priceAnnual: c.env.STRIPE_PRICE_ANNUAL,
  };
  const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
  const session = await createCheckoutSession(userId, body.plan, config, c.env.DB, appUrl);
  return c.json(session);
});

authed.post('/billing/portal', async (c) => {
  const userId = c.get('userId');
  const config = { secretKey: c.env.STRIPE_SECRET_KEY, webhookSecret: c.env.STRIPE_WEBHOOK_SECRET };
  const appUrl = c.env.APP_URL || 'https://quidsafe.uk';
  const session = await createPortalSession(userId, config, c.env.DB, appUrl);
  return c.json(session);
});

authed.get('/billing/status', async (c) => {
  const userId = c.get('userId');
  const status = await getSubscriptionStatus(userId, c.env.DB);
  return c.json(status);
});

// ── HMRC MTD ─────────────────────────────────────────────

function getHmrcConfig(env: Env): HmrcConfig {
  return {
    clientId: env.HMRC_CLIENT_ID,
    clientSecret: env.HMRC_CLIENT_SECRET,
    redirectUri: env.HMRC_REDIRECT_URI || `${env.TRUELAYER_REDIRECT_URI.replace('/banking/callback', '/mtd/callback')}`,
  };
}

authed.get('/mtd/auth', async (c) => {
  const config = getHmrcConfig(c.env);
  const userId = c.get('userId');
  const platform = c.req.query('platform'); // 'native' for mobile apps

  // Generate cryptographically random state and store with short TTL
  // Encode platform in state so the callback knows where to redirect
  const stateId = crypto.randomUUID();
  const state = platform === 'native' ? `${stateId}_native` : stateId;
  await execute(
    c.env.DB,
    'INSERT INTO oauth_states (state, user_id, created_at) VALUES (?, ?, datetime(\'now\'))',
    [state, userId],
  );

  const url = getHmrcAuthUrl(config, state);
  return c.json({ url });
});

authed.post('/mtd/callback', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = mtdCallbackSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const { code, state } = result.data;

  // Validate OAuth state to prevent CSRF
  const oauthState = await queryOne<{ user_id: string }>(
    c.env.DB,
    'SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime(\'now\', \'-10 minutes\')',
    [state],
  );
  if (!oauthState || oauthState.user_id !== userId) {
    return c.json({ error: { code: 'INVALID_STATE', message: 'Invalid or expired OAuth state' } }, 403);
  }
  // Delete used state to prevent replay
  await execute(c.env.DB, 'DELETE FROM oauth_states WHERE state = ?', [state]);

  const config = getHmrcConfig(c.env);

  const tokens = await exchangeHmrcCode(code, config);
  const encrypted = await encryptTokens(
    { access_token: tokens.accessToken, refresh_token: tokens.refreshToken, expires_in: tokens.expiresIn, token_type: 'bearer' },
    c.env.ENCRYPTION_KEY,
  );

  await execute(c.env.DB,
    'INSERT INTO bank_connections (id, user_id, provider, bank_name, access_token_encrypted, refresh_token_encrypted) VALUES (?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), userId, 'hmrc', 'HMRC', encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted],
  );

  return c.json({ connected: true });
});

authed.get('/mtd/obligations', async (c) => {
  const userId = c.get('userId');

  // Look up and decrypt NINO
  const userRow = await queryOne<{ nino_encrypted: string | null }>(
    c.env.DB,
    'SELECT nino_encrypted FROM users WHERE id = ?',
    [userId],
  );
  if (!userRow?.nino_encrypted) {
    return c.json({ error: { code: 'NINO_REQUIRED', message: 'Please add your National Insurance Number in Settings' } }, 400);
  }
  const { decrypt: decryptNino } = await import('./utils/crypto');
  const nino = await decryptNino(userRow.nino_encrypted, c.env.ENCRYPTION_KEY);

  const hmrcConn = await queryOne<{ access_token_encrypted: string }>(
    c.env.DB,
    'SELECT access_token_encrypted FROM bank_connections WHERE user_id = ? AND provider = ? AND active = 1',
    [userId, 'hmrc'],
  );

  if (!hmrcConn) {
    return c.json({ error: { code: 'HMRC_NOT_CONNECTED', message: 'Connect your HMRC account first' } }, 400);
  }

  const { decrypt: decryptHmrc } = await import('./utils/crypto');
  const accessToken = await decryptHmrc(hmrcConn.access_token_encrypted, c.env.ENCRYPTION_KEY);
  const obligations = await getObligations(accessToken, nino);

  const submissions = await query<{ quarter: number; status: string; hmrc_receipt_id: string | null }>(
    c.env.DB,
    'SELECT quarter, status, hmrc_receipt_id FROM mtd_submissions WHERE user_id = ? ORDER BY quarter',
    [userId],
  );

  return c.json({ obligations, submissions });
});

authed.post('/mtd/submit-quarterly', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = mtdSubmitQuarterlySchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const { taxYear, quarter } = result.data;

  // Look up and decrypt NINO
  const userRow = await queryOne<{ nino_encrypted: string | null }>(
    c.env.DB,
    'SELECT nino_encrypted FROM users WHERE id = ?',
    [userId],
  );
  if (!userRow?.nino_encrypted) {
    return c.json({ error: { code: 'NINO_REQUIRED', message: 'Please add your National Insurance Number in Settings' } }, 400);
  }
  const { decrypt: decryptNino } = await import('./utils/crypto');
  const nino = await decryptNino(userRow.nino_encrypted, c.env.ENCRYPTION_KEY);

  const existing = await queryOne<{ id: string; status: string }>(
    c.env.DB,
    'SELECT id, status FROM mtd_submissions WHERE user_id = ? AND tax_year = ? AND quarter = ?',
    [userId, taxYear, quarter],
  );

  if (existing && existing.status === 'accepted') {
    return c.json({ error: { code: 'ALREADY_SUBMITTED', message: 'This quarter has already been submitted' } }, 409);
  }

  const quarters = getQuarterDates(taxYear);
  const qInfo = quarters.find((q) => q.quarter === quarter);
  if (!qInfo) return c.json({ error: { code: 'INVALID_QUARTER', message: 'Invalid quarter' } }, 400);

  const income = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ? AND transaction_date <= ?',
    [userId, qInfo.startDate, qInfo.endDate],
  );

  const expenses = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ? AND transaction_date <= ?',
    [userId, qInfo.startDate, qInfo.endDate],
  );

  const totalIncome = income?.total ?? 0;
  const totalExpenses = expenses?.total ?? 0;
  const payload = { periodStart: qInfo.startDate, periodEnd: qInfo.endDate, totalIncome, totalExpenses };

  const hmrcConn = await queryOne<{ access_token_encrypted: string }>(
    c.env.DB,
    'SELECT access_token_encrypted FROM bank_connections WHERE user_id = ? AND provider = ? AND active = 1',
    [userId, 'hmrc'],
  );

  if (!hmrcConn) {
    return c.json({ error: { code: 'HMRC_NOT_CONNECTED', message: 'Connect your HMRC account first' } }, 400);
  }

  const { decrypt: decryptHmrc } = await import('./utils/crypto');
  const accessToken = await decryptHmrc(hmrcConn.access_token_encrypted, c.env.ENCRYPTION_KEY);
  const submissionId = crypto.randomUUID();

  await execute(c.env.DB,
    'INSERT INTO mtd_submissions (id, user_id, tax_year, quarter, status, payload_json) VALUES (?, ?, ?, ?, ?, ?)',
    [submissionId, userId, taxYear, quarter, 'draft', JSON.stringify(payload)],
  );

  try {
    const response = await submitQuarterlyUpdate(accessToken, nino, payload);

    await execute(c.env.DB,
      'UPDATE mtd_submissions SET status = ?, hmrc_receipt_id = ?, response_json = ?, submitted_at = datetime(\'now\') WHERE id = ?',
      ['accepted', response.id, JSON.stringify(response), submissionId],
    );

    await audit(c.env.DB, {
      userId, action: 'mtd.submit', entityType: 'mtd_submission', entityId: submissionId,
      metadata: { taxYear, quarter, hmrcReceiptId: response.id, totalIncome, totalExpenses },
      ...auditContext(c.req.raw.headers),
    });

    return c.json({
      success: true,
      submissionId,
      hmrcReceiptId: response.id,
      summary: { taxYear, quarter, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[MTD] Submission failed:', err);
    await execute(c.env.DB,
      'UPDATE mtd_submissions SET status = ?, response_json = ? WHERE id = ?',
      ['rejected', JSON.stringify({ error: message }), submissionId],
    );
    return c.json({ error: { code: 'SUBMISSION_FAILED', message: 'HMRC submission failed. Please try again.' } }, 500);
  }
});

authed.get('/mtd/submission/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const submission = await queryOne(
    c.env.DB,
    'SELECT id, user_id, tax_year, quarter, status, hmrc_receipt_id, submitted_at, created_at FROM mtd_submissions WHERE id = ? AND user_id = ?',
    [id, userId],
  );

  if (!submission) return c.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, 404);
  return c.json({ submission });
});

// ── Settings ──────────────────────────────────────────────
authed.get('/settings', async (c) => {
  const userId = c.get('userId');
  const user = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT id, name, email, subscription_tier, nino_encrypted, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, notify_mtd_ready, created_at FROM users WHERE id = ?', [userId]);

  let ninoMasked: string | null = null;
  let ninoSet = false;
  if (user && typeof user.nino_encrypted === 'string') {
    const { decrypt } = await import('./utils/crypto');
    const nino = await decrypt(user.nino_encrypted, c.env.ENCRYPTION_KEY);
    ninoMasked = nino.slice(0, 2) + ' *** *** ' + nino.slice(-1);
    ninoSet = true;
  }

  return c.json({ user: { ...user, nino_encrypted: undefined, ninoMasked, ninoSet } });
});

authed.put('/settings', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = updateSettingsSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const body = result.data;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.name !== undefined) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.nino !== undefined) {
    const { encrypt } = await import('./utils/crypto');
    const ninoEncrypted = await encrypt(body.nino, c.env.ENCRYPTION_KEY);
    updates.push('nino_encrypted = ?');
    values.push(ninoEncrypted);
  }
  if (body.notifyTaxDeadlines !== undefined) {
    updates.push('notify_tax_deadlines = ?');
    values.push(body.notifyTaxDeadlines ? 1 : 0);
  }
  if (body.notifyWeeklySummary !== undefined) {
    updates.push('notify_weekly_summary = ?');
    values.push(body.notifyWeeklySummary ? 1 : 0);
  }
  if (body.notifyTransactionAlerts !== undefined) {
    updates.push('notify_transaction_alerts = ?');
    values.push(body.notifyTransactionAlerts ? 1 : 0);
  }
  if (body.notifyMtdReady !== undefined) {
    updates.push('notify_mtd_ready = ?');
    values.push(body.notifyMtdReady ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push('updated_at = datetime(\'now\')');
    values.push(userId);
    await execute(c.env.DB, `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  const user = await queryOne(c.env.DB, 'SELECT id, name, email, subscription_tier, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, notify_mtd_ready FROM users WHERE id = ?', [userId]);
  return c.json({ user });
});

// ── Mount authed routes ───────────────────────────────────

// ── Device Push Token Registration ───────────────────────
authed.post('/devices', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = registerDeviceSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const { pushToken, platform } = result.data;

  // Remove any existing entry for this token (any user) to prevent token squatting on device handover
  await execute(c.env.DB, 'DELETE FROM user_devices WHERE push_token = ?', [pushToken]);
  await execute(
    c.env.DB,
    'INSERT INTO user_devices (user_id, push_token, platform) VALUES (?, ?, ?)',
    [userId, pushToken, platform],
  );

  return c.json({ registered: true });
});

authed.delete('/devices', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const result = deleteDeviceSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: 'Validation error', details: result.error.flatten().fieldErrors }, 400);
  }
  const { pushToken } = result.data;

  await execute(c.env.DB, 'DELETE FROM user_devices WHERE user_id = ? AND push_token = ?', [userId, pushToken]);
  return c.json({ removed: true });
});

// ── Clients ─────────────────────────────────────────────
authed.get('/clients', async (c) => {
  const userId = c.get('userId');
  const clients = await query(c.env.DB,
    `SELECT c.*,
      (SELECT COUNT(*) FROM invoices WHERE client_id = c.id) as invoice_count,
      (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE client_id = c.id AND status = 'paid') as paid_total,
      (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE client_id = c.id AND (status = 'sent' OR status = 'overdue')) as outstanding
    FROM clients c WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
    [userId],
  );
  return c.json({ clients });
});

authed.post('/clients', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();
  const { name, email, phone, address, notes } = raw as {
    name: string; email?: string; phone?: string; address?: string; notes?: string;
  };
  if (!name?.trim()) {
    return c.json({ error: { code: 'VALIDATION', message: 'Client name is required' } }, 400);
  }
  const id = crypto.randomUUID();
  await execute(c.env.DB,
    'INSERT INTO clients (id, user_id, name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name.trim(), email?.trim() ?? null, phone?.trim() ?? null, address?.trim() ?? null, notes?.trim() ?? null],
  );
  return c.json({ id }, 201);
});

authed.put('/clients/:id', async (c) => {
  const userId = c.get('userId');
  const clientId = c.req.param('id');
  const raw = await c.req.json();
  const updates: string[] = [];
  const params: unknown[] = [];
  const fields = ['name', 'email', 'phone', 'address', 'notes'] as const;
  for (const f of fields) {
    if ((raw as Record<string, unknown>)[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(((raw as Record<string, unknown>)[f] as string)?.trim() ?? null);
    }
  }
  if (updates.length === 0) return c.json({ updated: false });
  updates.push("updated_at = datetime('now')");
  params.push(clientId, userId);
  await execute(c.env.DB, `UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  return c.json({ updated: true });
});

authed.delete('/clients/:id', async (c) => {
  const userId = c.get('userId');
  const clientId = c.req.param('id');
  await execute(c.env.DB, 'UPDATE invoices SET client_id = NULL WHERE client_id = ? AND user_id = ?', [clientId, userId]);
  await execute(c.env.DB, 'DELETE FROM clients WHERE id = ? AND user_id = ?', [clientId, userId]);
  return c.json({ deleted: true });
});

// ── Mileage ─────────────────────────────────────────────
authed.get('/mileage', async (c) => {
  const userId = c.get('userId');
  const taxYear = c.req.query('taxYear') || '2025/26';
  const startDate = `${taxYear.split('/')[0]}-04-06`;
  const endDate = `${parseInt(taxYear.split('/')[0], 10) + 1}-04-05`;

  const logs = await query(c.env.DB,
    'SELECT * FROM mileage_logs WHERE user_id = ? AND trip_date >= ? AND trip_date <= ? ORDER BY trip_date DESC',
    [userId, startDate, endDate],
  );

  const totalMiles = logs.reduce((s: number, l: Record<string, unknown>) => s + (l.miles as number), 0);
  const totalAmount = logs.reduce((s: number, l: Record<string, unknown>) => s + (l.amount as number), 0);

  return c.json({ logs, summary: { totalMiles, totalAmount, taxYear } });
});

authed.post('/mileage', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json();

  const { tripDate, description, miles, vehicleType = 'car', purpose } = raw as {
    tripDate: string; description: string; miles: number;
    vehicleType?: 'car' | 'motorcycle' | 'bicycle'; purpose?: string;
  };

  if (!tripDate || !description || !miles || miles <= 0) {
    return c.json({ error: { code: 'VALIDATION', message: 'tripDate, description, and miles are required' } }, 400);
  }

  // HMRC approved mileage rates 2025/26
  const rates: Record<string, number> = { car: 45, motorcycle: 24, bicycle: 20 };
  const ratePence = rates[vehicleType] || 45;
  const amount = parseFloat(((miles * ratePence) / 100).toFixed(2));

  const id = crypto.randomUUID();
  await execute(c.env.DB,
    'INSERT INTO mileage_logs (id, user_id, trip_date, description, miles, vehicle_type, purpose, rate_pence, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, tripDate, description, miles, vehicleType, purpose ?? null, ratePence, amount],
  );

  await audit(c.env.DB, {
    userId, action: 'expense.create', entityType: 'mileage_log', entityId: id,
    metadata: { miles, vehicleType, amount },
    ...auditContext(c.req.raw.headers),
  });

  return c.json({ id, amount, ratePence }, 201);
});

authed.delete('/mileage/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await execute(c.env.DB, 'DELETE FROM mileage_logs WHERE id = ? AND user_id = ?', [id, userId]);
  return c.json({ deleted: true });
});

app.route('/', authed);

// ─── Catch-all 404 ────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

// ─── Global error handler ─────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500,
  );
});

// ─── Scheduled Handler (Cron) ────────────────────────────
// Daily sync at 6:00 AM - configured in wrangler.toml [triggers]
async function scheduled(_event: { scheduledTime: number; cron: string }, env: Env) {
  console.log(`[Cron] Daily sync triggered at ${new Date().toISOString()}`);
  const config = getTrueLayerConfig(env);

  // Get all active bank connections
  const connections = await env.DB
    .prepare('SELECT id, user_id, bank_name, access_token_encrypted, refresh_token_encrypted, last_synced_at, active FROM bank_connections WHERE active = 1')
    .all<BankConnectionRow>();

  let successCount = 0;
  let failCount = 0;

  for (const connection of connections.results) {
    try {
      // Try to refresh the token first
      try {
        const newTokens = await refreshAccessToken(
          connection.refresh_token_encrypted,
          config,
        );
        const encrypted = await encryptTokens(newTokens, env.ENCRYPTION_KEY);
        await env.DB
          .prepare('UPDATE bank_connections SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE id = ?')
          .bind(encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted, connection.id)
          .run();
        // Update in-memory connection for sync
        connection.access_token_encrypted = encrypted.accessTokenEncrypted;
        connection.refresh_token_encrypted = encrypted.refreshTokenEncrypted;
      } catch (refreshErr) {
        const msg = refreshErr instanceof Error ? refreshErr.message : '';
        if (msg.includes('BANK_CONNECTION_EXPIRED')) {
          // Mark connection as inactive - user must reconnect
          await env.DB
            .prepare('UPDATE bank_connections SET active = 0 WHERE id = ?')
            .bind(connection.id)
            .run();
          console.log('[Cron] Connection expired - deactivated');
          failCount++;
          continue;
        }
        // Other refresh errors - try sync with existing token
      }

      const result = await syncTransactions(env.DB, connection, config);
      console.log(`[Cron] Synced ${result.synced} txns (${result.skipped} skipped)`);

      // Auto-categorise newly synced transactions
      if (result.synced > 0) {
        try {
          const uncatTxns = await env.DB
            .prepare('SELECT id, amount, description, merchant_name FROM transactions WHERE user_id = ? AND ai_category IS NULL LIMIT 200')
            .bind(connection.user_id)
            .all<{ id: string; amount: number; description: string; merchant_name: string | null }>();
          if (uncatTxns.results.length > 0) {
            const catCount = await categoriseAndSave(env.DB, uncatTxns.results, connection.user_id, env.ANTHROPIC_API_KEY);
            console.log(`[Cron] Auto-categorised ${catCount} txns`);
          }
        } catch (catErr) {
          console.error('[Cron] Auto-categorisation failed:', catErr);
        }
      }

      successCount++;
    } catch (err) {
      console.error('[Cron] Sync failed:', err);
      failCount++;
    }
  }

  console.log(`[Cron] Daily sync complete: ${successCount} success, ${failCount} failed out of ${connections.results.length} connections`);

  // ── Invoice overdue auto-transition ────────────────────────
  try {
    const overdueResult = await env.DB
      .prepare("UPDATE invoices SET status = 'overdue' WHERE status = 'sent' AND due_date < date('now')")
      .run();
    const overdueCount = (overdueResult.meta as { changes?: number }).changes ?? 0;
    if (overdueCount > 0) {
      console.log(`[Cron] Marked ${overdueCount} invoice(s) as overdue`);
    }
  } catch (overdueErr) {
    console.error('[Cron] Invoice overdue check failed:', overdueErr);
  }

  // ── Grace period expiry check ─────────────────────────────
  // Downgrade users whose 7-day payment grace period has expired
  try {
    const expiredGrace = await env.DB
      .prepare('SELECT id FROM users WHERE subscription_tier = ? AND grace_period_ends IS NOT NULL AND grace_period_ends <= datetime(\'now\')')
      .bind('past_due')
      .all<{ id: string }>();

    for (const user of expiredGrace.results) {
      await env.DB
        .prepare('UPDATE users SET subscription_tier = ?, grace_period_ends = NULL, updated_at = datetime(\'now\') WHERE id = ?')
        .bind('cancelled', user.id)
        .run();
      await env.DB
        .prepare('UPDATE subscriptions SET status = ? WHERE user_id = ?')
        .bind('cancelled', user.id)
        .run();
      console.log('[Cron] Grace period expired - subscription cancelled');
    }

    if (expiredGrace.results.length > 0) {
      console.log(`[Cron] Downgraded ${expiredGrace.results.length} user(s) after grace period expiry`);
    }
  } catch (graceErr) {
    console.error('[Cron] Grace period check failed:', graceErr);
  }

  // ── Recurring Expenses Auto-Log ───────────────────────────
  try {
    const today = new Date().toISOString().split('T')[0];
    const dueRecurring = await env.DB
      .prepare('SELECT id, user_id, amount, description, hmrc_category, frequency, next_due_date FROM recurring_expenses WHERE active = 1 AND next_due_date <= ?')
      .bind(today)
      .all<{ id: string; user_id: string; amount: number; description: string; hmrc_category: string; frequency: string; next_due_date: string }>();

    if (dueRecurring.results.length > 0) {
      // Batch all inserts and updates into a single D1 call (was N+1 before)
      const statements = [];
      for (const rec of dueRecurring.results) {
        const expenseId = crypto.randomUUID();
        statements.push(
          env.DB
            .prepare('INSERT INTO expenses (id, user_id, amount, description, hmrc_category, date) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(expenseId, rec.user_id, rec.amount, rec.description, rec.hmrc_category, rec.next_due_date),
        );

        const nextDate = new Date(rec.next_due_date);
        switch (rec.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        const nextDueDateStr = nextDate.toISOString().split('T')[0];

        statements.push(
          env.DB
            .prepare('UPDATE recurring_expenses SET next_due_date = ? WHERE id = ?')
            .bind(nextDueDateStr, rec.id),
        );
      }

      await env.DB.batch(statements);
      console.log(`[Cron] Auto-logged ${dueRecurring.results.length} recurring expense(s) via batch`);
    }
  } catch (recurringErr) {
    console.error('[Cron] Recurring expenses auto-log failed:', recurringErr);
  }

  // ── Notification checks (pre-aggregated - no per-user queries) ──
  try {
    const now = new Date();
    const { taxYear } = getCurrentQuarter(now);
    const deadlines = getUKTaxDeadlines(taxYear);

    // Single query: users + their push tokens + subscription info
    const usersWithTokens = await env.DB
      .prepare(`SELECT u.id, u.notify_tax_deadlines, u.notify_weekly_summary, u.notify_transaction_alerts, u.notify_mtd_ready,
                u.subscription_tier, u.created_at, s.status AS sub_status, s.trial_ends_at,
                d.push_token
                FROM users u
                INNER JOIN user_devices d ON u.id = d.user_id AND d.active = 1
                LEFT JOIN subscriptions s ON u.id = s.user_id`)
      .all<{ id: string; notify_tax_deadlines: number; notify_weekly_summary: number; notify_transaction_alerts: number; notify_mtd_ready: number; subscription_tier: string; created_at: string; sub_status: string | null; trial_ends_at: string | null; push_token: string }>();

    // Group tokens by user in memory (avoids per-user token query)
    const userTokenMap = new Map<string, { tokens: string[]; user: typeof usersWithTokens.results[0] }>();
    for (const row of usersWithTokens.results) {
      const entry = userTokenMap.get(row.id);
      if (entry) {
        entry.tokens.push(row.push_token);
      } else {
        userTokenMap.set(row.id, { tokens: [row.push_token], user: row });
      }
    }

    // Pre-aggregate: weekly income for all users in one query
    const weeklyIncomeAll = now.getDay() === 1
      ? await env.DB.prepare(
          'SELECT user_id, COALESCE(SUM(amount), 0) as total, COUNT(DISTINCT income_source) as sources FROM transactions WHERE is_income = 1 AND transaction_date >= date(\'now\', \'-7 days\') GROUP BY user_id'
        ).all<{ user_id: string; total: number; sources: number }>()
      : { results: [] as { user_id: string; total: number; sources: number }[] };
    const weeklyIncomeMap = new Map(weeklyIncomeAll.results.map((r) => [r.user_id, r]));

    // Pre-aggregate: quarterly income for deadline reminders (all users)
    const needsDeadlineIncome = deadlines.some((d) => {
      const daysUntil = Math.ceil((new Date(d.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (daysUntil === 14 || daysUntil === 7) && d.quarter;
    });
    const quarterlyIncomeAll = needsDeadlineIncome
      ? await env.DB.prepare(
          'SELECT user_id, COALESCE(SUM(CASE WHEN is_income = 1 THEN amount ELSE 0 END), 0) as income FROM transactions WHERE transaction_date >= date(\'now\', \'-90 days\') GROUP BY user_id'
        ).all<{ user_id: string; income: number }>()
      : { results: [] as { user_id: string; income: number }[] };
    const quarterlyIncomeMap = new Map(quarterlyIncomeAll.results.map((r) => [r.user_id, r]));

    // Pre-aggregate: expiring bank connections (all users)
    const expiringBanksAll = await env.DB
      .prepare('SELECT user_id, bank_name, consent_expires_at FROM bank_connections WHERE active = 1 AND consent_expires_at IS NOT NULL')
      .all<{ user_id: string; bank_name: string; consent_expires_at: string }>();
    const expiringBanksMap = new Map<string, typeof expiringBanksAll.results>();
    for (const bank of expiringBanksAll.results) {
      const existing = expiringBanksMap.get(bank.user_id) || [];
      existing.push(bank);
      expiringBanksMap.set(bank.user_id, existing);
    }

    // Process each user using pre-aggregated data (zero additional D1 queries)
    for (const [userId, { tokens: pushTokens, user }] of userTokenMap) {
      // Tax deadline reminders
      if (user.notify_tax_deadlines) {
        for (const deadline of deadlines) {
          const daysUntil = Math.ceil((new Date(deadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil === 14 && deadline.quarter) {
            const income = quarterlyIncomeMap.get(userId)?.income ?? 0;
            const estimated = formatCurrency(income * 0.25);
            await sendPushNotifications(buildPushMessages(pushTokens, deadlineReminder14Days(deadline.quarter, deadline.date, estimated)));
          }
          if (daysUntil === 7 && deadline.quarter) {
            const income = quarterlyIncomeMap.get(userId)?.income ?? 0;
            const estimated = formatCurrency(income * 0.25);
            await sendPushNotifications(buildPushMessages(pushTokens, deadlineReminder7Days(deadline.quarter, deadline.date, estimated)));
          }
          if (daysUntil === 3 && deadline.quarter) {
            await sendPushNotifications(buildPushMessages(pushTokens, deadlineUrgent3Days(deadline.quarter, deadline.date)));
          }
          if (daysUntil === 1 && deadline.quarter) {
            await sendPushNotifications(buildPushMessages(pushTokens, deadlineUrgent1Day(deadline.quarter, deadline.date)));
          }
        }
      }

      // MTD submission ready - quarter ended and user hasn't submitted yet
      if (user.notify_mtd_ready) {
        for (const deadline of deadlines) {
          if (!deadline.quarter) continue;
          const daysUntil = Math.ceil((new Date(deadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          // Notify when quarter ended (deadline is 7-14 days away) and no submission exists
          if (daysUntil >= 7 && daysUntil <= 14) {
            const submission = await queryOne<{ id: string }>(
              env.DB,
              "SELECT id FROM mtd_submissions WHERE user_id = ? AND quarter = ? AND tax_year = ? AND status IN ('submitted', 'accepted')",
              [userId, deadline.quarter, taxYear],
            );
            if (!submission) {
              await sendPushNotifications(buildPushMessages(pushTokens, mtdSubmissionReady(deadline.quarter)));
              break; // Only one MTD reminder per cron run
            }
          }
        }
      }

      // Weekly income summary (Monday only)
      if (user.notify_weekly_summary && now.getDay() === 1) {
        const wi = weeklyIncomeMap.get(userId);
        if (wi && wi.total > 0) {
          await sendPushNotifications(buildPushMessages(pushTokens, weeklySummary(formatCurrency(wi.total), wi.sources, formatCurrency(wi.total * 0.25))));
        }
      }

      // Bank re-auth warnings
      const banks = expiringBanksMap.get(userId) || [];
      for (const bank of banks) {
        const daysUntilExpiry = Math.ceil((new Date(bank.consent_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry === 7) {
          await sendPushNotifications(buildPushMessages(pushTokens, bankReauthNeeded(bank.bank_name || 'your bank', daysUntilExpiry)));
        }
      }

      // Trial ending reminder
      if (user.sub_status === 'trialing' && user.trial_ends_at) {
        const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft === 2) {
          await sendPushNotifications(buildPushMessages(pushTokens, trialEnding(daysLeft)));
        }
      }
    }

    console.log(`[Cron] Notification checks complete for ${userTokenMap.size} users`);
  } catch (notifErr) {
    console.error('[Cron] Notification checks failed:', notifErr);
  }

  // ── Rate Limit Cleanup ──────────────────────────────────
  try {
    const purged = await purgeExpiredRateLimits(env.DB);
    console.log(`[Cron] Purged ${purged} expired rate limit entries`);
  } catch (rlErr) {
    console.error('[Cron] Rate limit cleanup failed:', rlErr);
  }

  // ── OAuth State Cleanup ─────────────────────────────────
  try {
    const oauthPurged = await env.DB
      .prepare("DELETE FROM oauth_states WHERE created_at < datetime('now', '-1 hour')")
      .run();
    const oauthChanges = (oauthPurged.meta as { changes?: number }).changes ?? 0;
    if (oauthChanges > 0) {
      console.log(`[Cron] Purged ${oauthChanges} expired oauth state(s)`);
    }
  } catch (oauthErr) {
    console.error('[Cron] OAuth state cleanup failed:', oauthErr);
  }
}

export default {
  fetch: app.fetch,
  scheduled,
};
