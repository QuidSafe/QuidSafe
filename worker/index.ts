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
import { calculateTax, getCurrentQuarter, getQuarterDates, formatCurrency } from '../lib/tax-engine';
import {
  sendPushNotifications,
  buildPushMessages,
  getUKTaxDeadlines,
  deadlineReminder14Days,
  deadlineUrgent3Days,
  weeklySummary,
  bankReauthNeeded,
  trialEnding,
} from './services/notifications';
import {
  getHmrcAuthUrl,
  exchangeHmrcCode,
  getObligations,
  submitQuarterlyUpdate,
} from './services/hmrc';
import type { HmrcConfig } from './services/hmrc';
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

// ─── Subscription Guard Middleware ───────────────────────
// Blocks write-sensitive routes when subscription is 'free' and trial has ended
// or when subscription is 'cancelled'. Returns 402 for paywall enforcement.
async function requireActiveSubscription(c: any, next: any) {
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

  // For free/cancelled users, check if they have an active trial
  if (tier === 'free' || tier === 'cancelled') {
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

// Apply subscription guard to write-sensitive routes
authed.post('/banking/sync/:id', requireActiveSubscription);
authed.post('/transactions/categorise', requireActiveSubscription);
authed.post('/mtd/*', requireActiveSubscription);

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

// ── Quarterly Breakdown ──────────────────────────────────
authed.get('/tax/quarters', async (c) => {
  const userId = c.get('userId');
  const taxYear = c.req.query('taxYear') ?? getCurrentQuarter().taxYear;
  const quarters = getQuarterDates(taxYear);

  const populated = await Promise.all(
    quarters.map(async (q) => {
      const income = await queryOne<{ total: number }>(
        c.env.DB,
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= ? AND transaction_date <= ?',
        [userId, q.startDate, q.endDate],
      );
      const expenses = await queryOne<{ total: number }>(
        c.env.DB,
        'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE user_id = ? AND ai_category = \'business_expense\' AND transaction_date >= ? AND transaction_date <= ?',
        [userId, q.startDate, q.endDate],
      );

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

// ── HMRC MTD ─────────────────────────────────────────────

function getHmrcConfig(env: Env): HmrcConfig {
  return {
    clientId: env.HMRC_CLIENT_ID,
    clientSecret: env.HMRC_CLIENT_SECRET,
    redirectUri: `${env.TRUELAYER_REDIRECT_URI.replace('/banking/callback', '/mtd/callback')}`,
  };
}

authed.get('/mtd/auth', async (c) => {
  const config = getHmrcConfig(c.env);
  const userId = c.get('userId');
  const state = btoa(JSON.stringify({ userId }));
  const url = getHmrcAuthUrl(config, state);
  return c.json({ url });
});

authed.post('/mtd/callback', async (c) => {
  const userId = c.get('userId');
  const { code } = await c.req.json<{ code: string }>();
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
  const obligations = await getObligations(accessToken, userId);

  const submissions = await query<{ quarter: number; status: string; hmrc_receipt_id: string | null }>(
    c.env.DB,
    'SELECT quarter, status, hmrc_receipt_id FROM mtd_submissions WHERE user_id = ? ORDER BY quarter',
    [userId],
  );

  return c.json({ obligations, submissions });
});

authed.post('/mtd/submit-quarterly', async (c) => {
  const userId = c.get('userId');
  const { taxYear, quarter } = await c.req.json<{ taxYear: string; quarter: number }>();

  if (!taxYear || !quarter || quarter < 1 || quarter > 4) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'Valid taxYear and quarter (1-4) required' } }, 400);
  }

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
    const response = await submitQuarterlyUpdate(accessToken, userId, payload);

    await execute(c.env.DB,
      'UPDATE mtd_submissions SET status = ?, hmrc_receipt_id = ?, response_json = ?, submitted_at = datetime(\'now\') WHERE id = ?',
      ['accepted', response.id, JSON.stringify(response), submissionId],
    );

    return c.json({
      success: true,
      submissionId,
      hmrcReceiptId: response.id,
      summary: { taxYear, quarter, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await execute(c.env.DB,
      'UPDATE mtd_submissions SET status = ?, response_json = ? WHERE id = ?',
      ['rejected', JSON.stringify({ error: message }), submissionId],
    );
    return c.json({ error: { code: 'SUBMISSION_FAILED', message } }, 500);
  }
});

authed.get('/mtd/submission/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const submission = await queryOne(
    c.env.DB,
    'SELECT * FROM mtd_submissions WHERE id = ? AND user_id = ?',
    [id, userId],
  );

  if (!submission) return c.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, 404);
  return c.json({ submission });
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

// ── Device Push Token Registration ───────────────────────
authed.post('/devices', async (c) => {
  const userId = c.get('userId');
  const { pushToken, platform } = await c.req.json<{ pushToken: string; platform: string }>();

  if (!pushToken || !platform) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'pushToken and platform are required' } }, 400);
  }

  // Remove any existing entry for this token, then insert
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
  const { pushToken } = await c.req.json<{ pushToken: string }>();

  await execute(c.env.DB, 'DELETE FROM user_devices WHERE user_id = ? AND push_token = ?', [userId, pushToken]);
  return c.json({ removed: true });
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
        .bind('free', user.id)
        .run();
      await env.DB
        .prepare('UPDATE subscriptions SET status = ? WHERE user_id = ?')
        .bind('cancelled', user.id)
        .run();
      console.log(`[Cron] Grace period expired for user ${user.id} — downgraded to free`);
    }

    if (expiredGrace.results.length > 0) {
      console.log(`[Cron] Downgraded ${expiredGrace.results.length} user(s) after grace period expiry`);
    }
  } catch (graceErr) {
    console.error('[Cron] Grace period check failed:', graceErr);
  }

  // ── Notification checks ──────────────────────────────────
  try {
    const now = new Date();
    const { taxYear } = getCurrentQuarter(now);
    const deadlines = getUKTaxDeadlines(taxYear);

    // Get all users with push tokens and notification preferences
    const usersWithDevices = await env.DB
      .prepare(`SELECT DISTINCT u.id, u.notify_tax_deadlines, u.notify_weekly_summary, u.notify_transaction_alerts,
                u.subscription_tier, u.created_at
                FROM users u INNER JOIN user_devices d ON u.id = d.user_id WHERE d.active = 1`)
      .all<{ id: string; notify_tax_deadlines: number; notify_weekly_summary: number; notify_transaction_alerts: number; subscription_tier: string; created_at: string }>();

    for (const user of usersWithDevices.results) {
      const tokens = await env.DB
        .prepare('SELECT push_token FROM user_devices WHERE user_id = ? AND active = 1')
        .bind(user.id)
        .all<{ push_token: string }>();

      const pushTokens = tokens.results.map((t) => t.push_token);
      if (pushTokens.length === 0) continue;

      // Tax deadline reminders (14 days and 3 days before)
      if (user.notify_tax_deadlines) {
        for (const deadline of deadlines) {
          const deadlineDate = new Date(deadline.date);
          const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntil === 14 && deadline.quarter) {
            const taxResult = await env.DB
              .prepare('SELECT COALESCE(SUM(CASE WHEN is_income = 1 THEN amount ELSE 0 END), 0) as income FROM transactions WHERE user_id = ? AND transaction_date >= date(\'now\', \'-90 days\')')
              .bind(user.id)
              .first<{ income: number }>();
            const estimated = formatCurrency(taxResult?.income ? taxResult.income * 0.25 : 0);
            const template = deadlineReminder14Days(deadline.quarter, deadline.date, estimated);
            await sendPushNotifications(buildPushMessages(pushTokens, template));
          }

          if (daysUntil === 3 && deadline.quarter) {
            const template = deadlineUrgent3Days(deadline.quarter, deadline.date);
            await sendPushNotifications(buildPushMessages(pushTokens, template));
          }
        }
      }

      // Weekly income summary (Monday only — day 1)
      if (user.notify_weekly_summary && now.getDay() === 1) {
        const weeklyIncome = await env.DB
          .prepare('SELECT COALESCE(SUM(amount), 0) as total, COUNT(DISTINCT income_source) as sources FROM transactions WHERE user_id = ? AND is_income = 1 AND transaction_date >= date(\'now\', \'-7 days\')')
          .bind(user.id)
          .first<{ total: number; sources: number }>();

        if (weeklyIncome && weeklyIncome.total > 0) {
          const taxToSetAside = formatCurrency(weeklyIncome.total * 0.25);
          const template = weeklySummary(formatCurrency(weeklyIncome.total), weeklyIncome.sources, taxToSetAside);
          await sendPushNotifications(buildPushMessages(pushTokens, template));
        }
      }

      // Bank re-auth warnings (7 days before consent expiry)
      const expiringBanks = await env.DB
        .prepare('SELECT bank_name, consent_expires_at FROM bank_connections WHERE user_id = ? AND active = 1 AND consent_expires_at IS NOT NULL')
        .bind(user.id)
        .all<{ bank_name: string; consent_expires_at: string }>();

      for (const bank of expiringBanks.results) {
        const expiryDate = new Date(bank.consent_expires_at);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry === 7) {
          const template = bankReauthNeeded(bank.bank_name || 'your bank', daysUntilExpiry);
          await sendPushNotifications(buildPushMessages(pushTokens, template));
        }
      }

      // Trial ending reminder (2 days before trial end)
      if (user.subscription_tier === 'free') {
        const createdAt = new Date(user.created_at);
        const trialEnd = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft === 2) {
          const template = trialEnding(daysLeft);
          await sendPushNotifications(buildPushMessages(pushTokens, template));
        }
      }
    }

    console.log(`[Cron] Notification checks complete for ${usersWithDevices.results.length} users`);
  } catch (notifErr) {
    console.error('[Cron] Notification checks failed:', notifErr);
  }
}

export default {
  fetch: app.fetch,
  scheduled,
};
