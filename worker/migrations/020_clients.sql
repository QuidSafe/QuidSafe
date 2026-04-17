-- Client/customer management for sole traders.
-- Links invoices to clients for payment history + outstanding balance tracking.
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_invoiced REAL NOT NULL DEFAULT 0,
  total_paid REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- Link invoices to clients (optional FK - existing invoices keep working)
ALTER TABLE invoices ADD COLUMN client_id TEXT REFERENCES clients(id);
