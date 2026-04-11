-- Composite index for the daily cron recurring expenses query:
-- SELECT ... FROM recurring_expenses WHERE active = 1 AND next_due_date <= ?
-- Previously performed a full table scan once per day.
CREATE INDEX IF NOT EXISTS idx_recurring_active_due
  ON recurring_expenses(active, next_due_date);
