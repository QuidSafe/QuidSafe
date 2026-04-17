-- Recurring invoices for retainer/subscription clients.
-- Cron generates invoices from templates on schedule.
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(frequency IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'annually')),
  next_due_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  invoices_generated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_due
  ON recurring_invoices(active, next_due_date)
  WHERE active = 1;
