-- Audit log for financial mutations.
-- Required for MTD digital record-keeping rules and useful for
-- dispute resolution + fraud investigation.
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,       -- e.g. 'invoice.create', 'mtd.submit', 'bank.disconnect'
  entity_type TEXT,            -- e.g. 'invoice', 'transaction', 'bank_connection'
  entity_id TEXT,              -- UUID of the entity affected
  metadata TEXT,               -- Optional JSON string with details (amount, status change etc)
  ip_address TEXT,             -- cf-connecting-ip at time of action
  user_agent TEXT,             -- truncated to 256 chars
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
