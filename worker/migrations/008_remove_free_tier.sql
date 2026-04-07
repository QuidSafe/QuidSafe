-- Migration: Remove free tier, replace with trialing
-- All users now start on a 14-day trial then must subscribe.

-- Step 1: Update any existing 'free' tier users to 'trialing'
UPDATE users SET subscription_tier = 'trialing', updated_at = datetime('now')
  WHERE subscription_tier = 'free';

-- Step 2: Update subscriptions table — change 'free' plans to 'pro_monthly'
UPDATE subscriptions SET plan = 'pro_monthly'
  WHERE plan = 'free';

-- Note: SQLite does not support ALTER CHECK constraints.
-- The CHECK constraints in earlier migrations allowed 'free'.
-- New application code enforces the valid tiers: trialing, pro, past_due, cancelled.
-- A future full schema rebuild (or new table) can tighten the CHECK constraints.
