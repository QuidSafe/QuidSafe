-- QuidSafe D1 Schema - Add bank_connections, mtd_submissions, subscriptions, category_corrections
-- Migration 002

-- ─── Bank Connections ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_connections (
  id TEXT PRIMARY KEY,                                -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'truelayer',
  bank_name TEXT NOT NULL,                            -- e.g. 'Monzo', 'Starling'
  access_token_encrypted TEXT NOT NULL,               -- AES-256-GCM encrypted
  refresh_token_encrypted TEXT NOT NULL,
  consent_expires_at TEXT,                            -- ISO 8601
  last_synced_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bank_connections_user ON bank_connections(user_id);

-- Add FK from transactions to bank_connections
-- (SQLite doesn't support ALTER TABLE ADD CONSTRAINT, but the column already exists)

-- ─── MTD Submissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS mtd_submissions (
  id TEXT PRIMARY KEY,                                -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,                             -- e.g. '2026/27'
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  hmrc_receipt_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  payload_json TEXT NOT NULL DEFAULT '{}',            -- JSON string of what was sent
  response_json TEXT,                                 -- JSON string of HMRC response
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mtd_submissions_user ON mtd_submissions(user_id);
CREATE INDEX idx_mtd_submissions_year ON mtd_submissions(user_id, tax_year, quarter);

-- ─── Subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                                -- UUID
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro_monthly', 'pro_annual')),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  trial_ends_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ─── Category Corrections (AI learning signal) ───────────
CREATE TABLE IF NOT EXISTS category_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  original_category TEXT NOT NULL,                    -- What AI predicted
  corrected_category TEXT NOT NULL,                   -- What user chose
  merchant_name TEXT,                                 -- For pattern matching
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_corrections_merchant ON category_corrections(merchant_name);

-- ─── Expenses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,                                -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id),
  hmrc_category TEXT,
  receipt_url TEXT,
  date TEXT NOT NULL,                                 -- ISO 8601 date
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(user_id, date);

-- ─── Invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,                                -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  amount REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date TEXT NOT NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);

-- ─── User Devices (push notifications) ───────────────────
CREATE TABLE IF NOT EXISTS user_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);

-- ─── Add missing columns to transactions ─────────────────
-- Extra fields from the full spec
ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'GBP';
ALTER TABLE transactions ADD COLUMN raw_category TEXT;
ALTER TABLE transactions ADD COLUMN ai_reasoning TEXT;
ALTER TABLE transactions ADD COLUMN is_expense_claimable INTEGER NOT NULL DEFAULT 0;
