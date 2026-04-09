-- Fix subscription_tier CHECK constraint to match application logic.
-- Removes stale 'free' value, adds 'trialing' which the app already uses.
-- Also fixes subscriptions.plan CHECK to remove 'free'.
--
-- SQLite requires table rebuild to alter CHECK constraints.

-- Clean up orphan tables from previous failed migration attempt
DROP TABLE IF EXISTS users_new;
DROP TABLE IF EXISTS subscriptions_new;

-- Step 1: Rebuild users table with correct CHECK
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripe_customer_id TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_tier IN ('trialing', 'pro', 'past_due', 'cancelled')),
  grace_period_ends TEXT,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  nino_encrypted TEXT,
  notify_tax_deadlines INTEGER NOT NULL DEFAULT 1,
  notify_weekly_summary INTEGER NOT NULL DEFAULT 1,
  notify_transaction_alerts INTEGER NOT NULL DEFAULT 0,
  notify_mtd_ready INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new SELECT
  id, email, name, stripe_customer_id,
  CASE
    WHEN subscription_tier = 'free' THEN 'trialing'
    ELSE subscription_tier
  END,
  grace_period_ends, onboarding_completed, nino_encrypted,
  notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, notify_mtd_ready,
  created_at, updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 2: Rebuild subscriptions table with correct CHECK
CREATE TABLE subscriptions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'pro_monthly' CHECK (plan IN ('pro_monthly', 'pro_annual')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  trial_ends_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO subscriptions_new SELECT
  id, user_id, stripe_customer_id, stripe_subscription_id,
  CASE
    WHEN plan = 'free' THEN 'pro_monthly'
    ELSE plan
  END,
  status, trial_ends_at, current_period_start, current_period_end,
  created_at, datetime('now')
FROM subscriptions;

DROP TABLE subscriptions;
ALTER TABLE subscriptions_new RENAME TO subscriptions;

-- Recreate indexes that were on the original tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);
