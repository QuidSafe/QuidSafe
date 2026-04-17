-- Sequential invoice numbers (INV-001, INV-002, etc) per user.
-- Also adds reminder tracking for late payment follow-ups.
ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN last_reminder_sent TEXT;
ALTER TABLE invoices ADD COLUMN reminder_count INTEGER NOT NULL DEFAULT 0;

-- Per-user invoice counter for sequential numbering
CREATE TABLE IF NOT EXISTS invoice_counters (
  user_id TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1,
  prefix TEXT NOT NULL DEFAULT 'INV',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for overdue invoice detection (used by cron)
CREATE INDEX IF NOT EXISTS idx_invoices_overdue
  ON invoices(user_id, status, due_date)
  WHERE status = 'sent' OR status = 'overdue';
