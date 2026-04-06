CREATE TABLE IF NOT EXISTS recurring_expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  hmrc_category TEXT DEFAULT 'other',
  frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date TEXT NOT NULL,
  next_due_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
