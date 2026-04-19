-- Migration 022: admin hub metrics
-- Adds:
--   (1) subscriptions.monthly_amount_pence  -- denormalised for MRR aggregation
--   (2) scheduled_jobs                      -- tracks cron handler last-run

-- ── (1) subscriptions.monthly_amount_pence ─────────────────────────────
-- Stored in pence to avoid float drift on aggregation. Populated on
-- checkout_session_completed + customer_subscription_updated webhooks.
-- Null for pre-existing rows; a daily catch-up could backfill from Stripe.
ALTER TABLE subscriptions ADD COLUMN monthly_amount_pence INTEGER;

-- Quick seed based on plan so the admin hub MRR isn't 0 for existing subs
-- until webhooks repopulate. Safe: these are our only two plans.
UPDATE subscriptions
SET monthly_amount_pence = 799
WHERE plan = 'pro_monthly' AND monthly_amount_pence IS NULL;

UPDATE subscriptions
SET monthly_amount_pence = 666    -- £79.99/yr ÷ 12 = £6.66/mo
WHERE plan = 'pro_annual' AND monthly_amount_pence IS NULL;

-- ── (2) scheduled_jobs ─────────────────────────────────────────────────
-- One row per named cron phase. Updated at the start and end of each run
-- so the admin hub can show "last ran 2h ago, took 4.3s, success".
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  job_name       TEXT PRIMARY KEY,
  last_started_at TEXT,
  last_finished_at TEXT,
  last_duration_ms INTEGER,
  last_status    TEXT CHECK (last_status IN ('success', 'failed', 'running')),
  last_error     TEXT,
  run_count      INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
