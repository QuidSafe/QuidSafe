import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { clerkAuth } from './middleware/auth';
import { getConnectUrl, exchangeCode, encryptTokens } from './services/banking';
import { calculateTax, getCurrentQuarter, getQuarterDates } from '../lib/tax-engine';
import { query, queryOne, execute } from '../lib/db';
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  verifyWebhookSignature,
  handleWebhookEvent,
} from './services/stripe';

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
  ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
}

type AuthedEnv = { Bindings: Env; Variables: { userId: string; userEmail?: string } };

const app = new Hono<AuthedEnv>();

// ─── Global Middleware ────────────────────────────────────
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:8081', 'https://quidsafe.co.uk', 'https://app.quidsafe.co.uk'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// ─── Public Routes ────────────────────────────────────────

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
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

  const event = JSON.parse(body);
  await handleWebhookEvent(event, c.env.DB);
  return c.json({ received: true });
});

// ─── Auth-Protected Routes ────────────────────────────────
// All routes below require a valid Clerk JWT

const authed = new Hono<AuthedEnv>();
authed.use('*', clerkAuth());

// ── Auth ──────────────────────────────────────────────────
authed.post('/auth/signup', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ email: string; name?: string }>();

  await execute(c.env.DB, 'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)', [
    userId,
    body.email,
    body.name ?? '',
  ]);

  const user = await queryOne(c.env.DB, 'SELECT * FROM users WHERE id = ?', [userId]);
  return c.json({ user });
});

authed.post('/auth/session', async (c) => {
  const userId = c.get('userId');
  const user = await queryOne(c.env.DB, 'SELECT * FROM users WHERE id = ?', [userId]);

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

  const user = await queryOne<{ name: string; subscription_tier: string }>(
    c.env.DB,
    'SELECT name, subscription_tier FROM users WHERE id = ?',
    [userId],
  );

  const incomeResult = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ?',
    [userId, `${taxYear.split('/')[0]}-04-06`],
  );

  const expenseResult = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ?',
    [userId, `${taxYear.split('/')[0]}-04-06`],
  );

  const totalIncome = incomeResult?.total ?? 0;
  const totalExpenses = expenseResult?.total ?? 0;
  const tax = calculateTax({ totalIncome, totalExpenses, quarter, taxYear });

  const incomeBySrc = await query<{ income_source: string; total: number }>(
    c.env.DB,
    'SELECT COALESCE(income_source, \'Other\') as income_source, SUM(amount) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ? GROUP BY income_source ORDER BY total DESC',
    [userId, `${taxYear.split('/')[0]}-04-06`],
  );

  const bySource = incomeBySrc.map((s) => ({
    name: s.income_source,
    amount: s.total,
    percentage: totalIncome > 0 ? Math.round((s.total / totalIncome) * 100) : 0,
  }));

  return c.json({
    user: { name: user?.name ?? '', subscriptionTier: user?.subscription_tier ?? 'free' },
    tax,
    income: { total: totalIncome, bySource },
    quarters: { current: { taxYear, quarter } },
  });
});

// ── Transactions ──────────────────────────────────────────
authed.get('/transactions', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') ?? '50', 10);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);
  const category = c.req.query('category');

  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
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

authed.get('/transactions/uncategorised', async (c) => {
  const userId = c.get('userId');
  const transactions = await query(
    c.env.DB,
    'SELECT * FROM transactions WHERE user_id = ? AND (ai_category IS NULL OR ai_confidence < 0.60) ORDER BY transaction_date DESC',
    [userId],
  );
  return c.json({ transactions });
});

authed.put('/transactions/:id/category', async (c) => {
  const userId = c.get('userId');
  const txId = c.req.param('id');
  const body = await c.req.json<{ category: string; incomeSource?: string }>();

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
  const config = {
    clientId: c.env.TRUELAYER_CLIENT_ID,
    clientSecret: c.env.TRUELAYER_CLIENT_SECRET,
    redirectUri: c.env.TRUELAYER_REDIRECT_URI,
    encryptionKey: c.env.ENCRYPTION_KEY,
    sandbox: c.env.ENVIRONMENT !== 'production',
  };

  const url = getConnectUrl(config, userId);
  return c.json({ url });
});

authed.get('/banking/callback', async (c) => {
  const userId = c.get('userId');
  const code = c.req.query('code');
  if (!code) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Missing code parameter' } }, 400);
  }

  const config = {
    clientId: c.env.TRUELAYER_CLIENT_ID,
    clientSecret: c.env.TRUELAYER_CLIENT_SECRET,
    redirectUri: c.env.TRUELAYER_REDIRECT_URI,
    encryptionKey: c.env.ENCRYPTION_KEY,
    sandbox: c.env.ENVIRONMENT !== 'production',
  };

  const tokens = await exchangeCode(code, config);
  const encrypted = await encryptTokens(tokens, c.env.ENCRYPTION_KEY);

  const connectionId = crypto.randomUUID();
  await execute(
    c.env.DB,
    'INSERT INTO bank_connections (id, user_id, bank_name, access_token_encrypted, refresh_token_encrypted) VALUES (?, ?, ?, ?, ?)',
    [connectionId, userId, 'Connected Bank', encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted],
  );

  return c.json({ connectionId, success: true });
});

authed.get('/banking/connections', async (c) => {
  const userId = c.get('userId');
  const connections = await query(
    c.env.DB,
    'SELECT id, bank_name, last_synced_at, active, created_at FROM bank_connections WHERE user_id = ? AND active = 1',
    [userId],
  );
  return c.json({ connections });
});

authed.delete('/banking/connections/:id', async (c) => {
  const userId = c.get('userId');
  const connId = c.req.param('id');
  await execute(
    c.env.DB,
    'UPDATE bank_connections SET active = 0 WHERE id = ? AND user_id = ?',
    [connId, userId],
  );
  return c.json({ disconnected: true });
});

// ── Tax ───────────────────────────────────────────────────
authed.get('/tax/calculation', async (c) => {
  const userId = c.get('userId');
  const { taxYear, quarter } = getCurrentQuarter();

  const incomeResult = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ?',
    [userId, `${taxYear.split('/')[0]}-04-06`],
  );

  const expenseResult = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ?',
    [userId, `${taxYear.split('/')[0]}-04-06`],
  );

  const result = calculateTax({
    totalIncome: incomeResult?.total ?? 0,
    totalExpenses: expenseResult?.total ?? 0,
    quarter,
    taxYear,
  });

  return c.json(result);
});

authed.get('/tax/quarterly', async (c) => {
  const userId = c.get('userId');
  const { taxYear } = getCurrentQuarter();
  const quarterDates = getQuarterDates(taxYear);

  const breakdown = [];
  for (const q of quarterDates) {
    const income = await queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date BETWEEN ? AND ?',
      [userId, q.startDate, q.endDate],
    );
    const expenses = await queryOne<{ total: number }>(
      c.env.DB,
      'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date BETWEEN ? AND ?',
      [userId, q.startDate, q.endDate],
    );

    breakdown.push({
      quarter: q.quarter,
      from: q.startDate,
      to: q.endDate,
      income: income?.total ?? 0,
      expenses: expenses?.total ?? 0,
    });
  }

  return c.json({ taxYear, quarters: breakdown });
});

// ── Expenses ──────────────────────────────────────────────
authed.get('/expenses', async (c) => {
  const userId = c.get('userId');
  const expenses = await query(c.env.DB, 'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [userId]);
  return c.json({ expenses });
});

authed.post('/expenses', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ amount: number; description: string; categoryId?: number; hmrcCategory?: string; date: string }>();
  const id = crypto.randomUUID();

  await execute(
    c.env.DB,
    'INSERT INTO expenses (id, user_id, amount, description, category_id, hmrc_category, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, body.amount, body.description, body.categoryId ?? null, body.hmrcCategory ?? null, body.date],
  );

  return c.json({ id, success: true }, 201);
});

authed.delete('/expenses/:id', async (c) => {
  const userId = c.get('userId');
  await execute(c.env.DB, 'DELETE FROM expenses WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
  return c.json({ deleted: true });
});

// ── Invoices ──────────────────────────────────────────────
authed.get('/invoices', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  let sql = 'SELECT * FROM invoices WHERE user_id = ?';
  const params: unknown[] = [userId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const invoices = await query(c.env.DB, sql, params);
  return c.json({ invoices });
});

authed.post('/invoices', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ clientName: string; clientEmail?: string; amount: number; description: string; dueDate: string }>();
  const id = crypto.randomUUID();

  await execute(
    c.env.DB,
    'INSERT INTO invoices (id, user_id, client_name, client_email, amount, description, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, body.clientName, body.clientEmail ?? null, body.amount, body.description, body.dueDate],
  );

  return c.json({ id, success: true }, 201);
});

// ── Billing ──────────────────────────────────────────────
authed.post('/billing/checkout', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ plan: 'monthly' | 'annual' }>();
  const config = { secretKey: c.env.STRIPE_SECRET_KEY, webhookSecret: c.env.STRIPE_WEBHOOK_SECRET };
  const session = await createCheckoutSession(userId, body.plan, config, c.env.DB);
  return c.json(session);
});

authed.post('/billing/portal', async (c) => {
  const userId = c.get('userId');
  const config = { secretKey: c.env.STRIPE_SECRET_KEY, webhookSecret: c.env.STRIPE_WEBHOOK_SECRET };
  const session = await createPortalSession(userId, config, c.env.DB);
  return c.json(session);
});

authed.get('/billing/status', async (c) => {
  const userId = c.get('userId');
  const status = await getSubscriptionStatus(userId, c.env.DB);
  return c.json(status);
});

// ── Settings ──────────────────────────────────────────────
authed.get('/settings', async (c) => {
  const userId = c.get('userId');
  const user = await queryOne(c.env.DB, 'SELECT * FROM users WHERE id = ?', [userId]);
  return c.json({ user });
});

authed.put('/settings', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ name?: string }>();

  if (body.name !== undefined) {
    await execute(c.env.DB, 'UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?', [body.name, userId]);
  }

  const user = await queryOne(c.env.DB, 'SELECT * FROM users WHERE id = ?', [userId]);
  return c.json({ user });
});

// ── Mount authed routes ───────────────────────────────────
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

export default app;
