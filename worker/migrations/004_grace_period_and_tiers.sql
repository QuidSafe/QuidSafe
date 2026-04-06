-- Add grace_period_ends column and expand subscription_tier CHECK constraint
-- to support 'past_due' and 'cancelled' tiers for payment failure grace period
-- and subscription deletion tracking.

-- SQLite does not support ALTER TABLE ... ALTER COLUMN, so we recreate the
-- constraint by adding a new column and migrating data. However, since D1
-- doesn't enforce CHECK on existing rows and SQLite CHECK is only validated
-- on INSERT/UPDATE, we can work around this by creating a new table.

-- Step 1: Add grace_period_ends column
ALTER TABLE users ADD COLUMN grace_period_ends TEXT;  -- ISO 8601 datetime

-- Step 2: Recreate users table with updated CHECK constraint
-- SQLite cannot alter CHECK constraints, so we use a migration workaround:
-- Create new table, copy data, drop old, rename.

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'past_due', 'cancelled')),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  grace_period_ends TEXT,
  notify_tax_deadlines INTEGER NOT NULL DEFAULT 1,
  notify_weekly_summary INTEGER NOT NULL DEFAULT 1,
  notify_transaction_alerts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id, email, name, subscription_tier, onboarding_completed, stripe_customer_id, grace_period_ends, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, created_at, updated_at)
  SELECT id, email, name, subscription_tier, onboarding_completed, stripe_customer_id, grace_period_ends, notify_tax_deadlines, notify_weekly_summary, notify_transaction_alerts, created_at, updated_at
  FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX idx_users_email ON users(email);
