import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { clerkAuth } from './middleware/auth';
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

function getTrueLayerConfig(env: Env): TrueLayerConfig {
  return {
    clientId: env.TRUELAYER_CLIENT_ID,
    clientSecret: env.TRUELAYER_CLIENT_SECRET,
    redirectUri: env.TRUELAYER_REDIRECT_URI,
    encryptionKey: env.ENCRYPTION_KEY,
    sandbox: env.ENVIRONMENT !== 'production',
  };
}

const app = new Hono<AuthedEnv>();

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

  for (const result of results) {
    await execute(
      db,
      'UPDATE transactions SET ai_category = ?, ai_confidence = ?, ai_reasoning = ?, is_income = ?, is_expense_claimable = ?, income_source = ? WHERE id = ? AND user_id = ?',
      [result.category, result.confidence, result.reasoning, result.category === 'income' ? 1 : 0, result.category === 'business_expense' ? 1 : 0, result.incomeSourceType, result.id, userId],
    );
  }

  return results.length;
}

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

  // Compute dynamic action items
  const actions: { id: string; type: string; title: string; subtitle: string; priority: number }[] = [];

  const uncatCount = await queryOne<{ count: number }>(
    c.env.DB,
    'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND (ai_category IS NULL OR ai_confidence < 0.6)',
    [userId],
  );
  if (uncatCount && uncatCount.count > 0) {
    actions.push({
      id: 'review_transactions',
      type: 'warning',
      title: `${uncatCount.count} transaction${uncatCount.count === 1 ? '' : 's'} need${uncatCount.count === 1 ? 's' : ''} review`,
      subtitle: 'Categorise them to improve your tax estimate',
      priority: 1,
    });
  }

  const bankCount = await queryOne<{ count: number }>(
    c.env.DB,
    'SELECT COUNT(*) as count FROM bank_connections WHERE user_id = ? AND status = ?',
    [userId, 'active'],
  );
  if (!bankCount || bankCount.count === 0) {
    actions.push({
      id: 'connect_bank',
      type: 'info',
      title: 'Connect your bank account',
      subtitle: 'Automatically import transactions for tax tracking',
      priority: 2,
    });
  }

  const overdueInvoices = await queryOne<{ count: number }>(
    c.env.DB,
    'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = ? AND due_date < date(\'now\')',
    [userId, 'sent'],
  );
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
    user: { name: user?.name ?? '', subscriptionTier: user?.subscription_tier ?? 'free' },
    tax,
    income: { total: totalIncome, bySource },
    quarters: { current: { taxYear, quarter } },
    actions,
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

  // Enforce multi-bank limits: 1 on free, 3 on pro
  const user = await queryOne<{ subscription_tier: string }>(
    c.env.DB,
    'SELECT subscription_tier FROM users WHERE id = ?',
    [userId],
  );
  const activeConns = await query(
    c.env.DB,
    'SELECT id FROM bank_connections WHERE user_id = ? AND active = 1',
    [userId],
  );
  const limit = user?.subscription_tier === 'pro' ? 3 : 1;
  if (activeConns.length >= limit) {
    return c.json(
      { error: { code: 'BANK_LIMIT_REACHED', message: `You can connect up to ${limit} bank${limit > 1 ? 's' : ''} on your current plan` } },
      403,
    );
  }

  const config = getTrueLayerConfig(c.env);
  const url = getConnectUrl(config, userId);
  return c.json({ url });
});

authed.get('/banking/callback', async (c) => {
  const userId = c.get('userId');
  const code = c.req.query('code');
  if (!code) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Missing code parameter' } }, 400);
  }

  const config = getTrueLayerConfig(c.env);
  const tokens = await exchangeCode(code, config);
  const encrypted = await encryptTokens(tokens, c.env.ENCRYPTION_KEY);

  // Detect bank name from TrueLayer
  const bankName = await detectBankName(tokens.access_token, config);

  const connectionId = crypto.randomUUID();
  await execute(
    c.env.DB,
    'INSERT INTO bank_connections (id, user_id, bank_name, access_token_encrypted, refresh_token_encrypted) VALUES (?, ?, ?, ?, ?)',
    [connectionId, userId, bankName, encrypted.accessTokenEncrypted, encrypted.refreshTokenEncrypted],
  );

  // Trigger initial transaction sync (last 30 days)
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

    // Auto-trigger AI categorisation for newly synced transactions
    if (result.synced > 0) {
      try {
        const uncategorised = await query<{ id: string; amount: number; description: string; merchant_name: string | null }>(
          c.env.DB,
          'SELECT id, amount, description, merchant_name FROM transactions WHERE user_id = ? AND ai_category IS NULL LIMIT 200',
          [userId],
        );
        if (uncategorised.length > 0) {
          await categoriseAndSave(c.env.DB, uncategorised, userId, c.env.ANTHROPIC_API_KEY);
        }
      } catch (catErr) {
        console.error('Auto-categorisation after connect failed:', catErr);
      }
    }

    return c.json({ connectionId, bankName, success: true, synced: result.synced });
  } catch (err) {
    // Connection saved even if initial sync fails — user can retry
    console.error('Initial sync failed:', err);
    return c.json({ connectionId, bankName, success: true, synced: 0, syncError: 'Initial sync failed — will retry automatically' });
  }
});

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
    'SELECT * FROM bank_connections WHERE id = ? AND user_id = ? AND active = 1',
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
      return c.json({ error: { code: 'BANK_CONNECTION_EXPIRED', message: 'Bank connection expired — please reconnect' } }, 401);
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

authed.put('/invoices/:id', async (c) => {
  const userId = c.get('userId');
  const invoiceId = c.req.param('id');
  const body = await c.req.json<{ status?: string; clientName?: string; clientEmail?: string; amount?: number; description?: string; dueDate?: string }>();

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
  const body = await c.req.json<{
    name?: string;
    notifyTaxDeadlines?: boolean;
    notifyWeeklySummary?: boolean;
    notifyTransactionAlerts?: boolean;
  }>();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.name !== undefined) {
    updates.push('name = ?');
    values.push(body.name);
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

  if (updates.length > 0) {
    updates.push('updated_at = datetime(\'now\')');
    values.push(userId);
    await execute(c.env.DB, `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
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

// ─── Scheduled Handler (Cron) ────────────────────────────
// Daily sync at 6:00 AM — configured in wrangler.toml [triggers]
async function scheduled(_event: { scheduledTime: number; cron: string }, env: Env) {
  console.log(`[Cron] Daily sync triggered at ${new Date().toISOString()}`);
  const config = getTrueLayerConfig(env);

  // Get all active bank connections
  const connections = await env.DB
    .prepare('SELECT * FROM bank_connections WHERE active = 1')
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
          // Mark connection as inactive — user must reconnect
          await env.DB
            .prepare('UPDATE bank_connections SET active = 0 WHERE id = ?')
            .bind(connection.id)
            .run();
          console.log(`[Cron] Connection ${connection.id} expired — deactivated`);
          failCount++;
          continue;
        }
        // Other refresh errors — try sync with existing token
      }

      const result = await syncTransactions(env.DB, connection, config);
      console.log(`[Cron] Synced ${result.synced} txns for connection ${connection.id} (${result.skipped} skipped)`);

      // Auto-categorise newly synced transactions
      if (result.synced > 0) {
        try {
          const uncatTxns = await env.DB
            .prepare('SELECT id, amount, description, merchant_name FROM transactions WHERE user_id = ? AND ai_category IS NULL LIMIT 200')
            .bind(connection.user_id)
            .all<{ id: string; amount: number; description: string; merchant_name: string | null }>();
          if (uncatTxns.results.length > 0) {
            const catCount = await categoriseAndSave(env.DB, uncatTxns.results, connection.user_id, env.ANTHROPIC_API_KEY);
            console.log(`[Cron] Auto-categorised ${catCount} txns for user ${connection.user_id}`);
          }
        } catch (catErr) {
          console.error(`[Cron] Auto-categorisation failed for ${connection.user_id}:`, catErr);
        }
      }

      successCount++;
    } catch (err) {
      console.error(`[Cron] Sync failed for connection ${connection.id}:`, err);
      failCount++;
    }
  }

  console.log(`[Cron] Daily sync complete: ${successCount} success, ${failCount} failed out of ${connections.results.length} connections`);
}

export default {
  fetch: app.fetch,
  scheduled,
};
