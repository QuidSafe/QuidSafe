-- Additional performance indexes identified by database review
-- Covers hot query paths for expense filtering, recurring expense cron,
-- category corrections lookup, device token cleanup, and oauth state expiry.

-- Composite index for expense queries: WHERE user_id = ? AND ai_category = 'business_expense' AND transaction_date >= ?
CREATE INDEX IF NOT EXISTS idx_transactions_expense_date
  ON transactions(user_id, ai_category, transaction_date);

-- Recurring expenses: WHERE user_id = ? and WHERE active = 1 AND next_due_date <= ?
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user
  ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_due
  ON recurring_expenses(active, next_due_date);

-- Category corrections: WHERE user_id = ? AND merchant_name IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_corrections_user_merchant
  ON category_corrections(user_id, merchant_name);

-- Device tokens: DELETE FROM user_devices WHERE push_token = ?
CREATE INDEX IF NOT EXISTS idx_user_devices_token
  ON user_devices(push_token);

-- OAuth states: cleanup query on created_at
CREATE INDEX IF NOT EXISTS idx_oauth_states_created
  ON oauth_states(created_at);
