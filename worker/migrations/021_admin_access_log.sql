-- Admin access audit trail.
-- Every request to /admin/* writes a row. Lets us answer questions like
-- "when did someone last touch the setup page" and catch unusual access
-- patterns (e.g. failed attempts from an unexpected IP).
--
-- Append-only by design. No updates, no deletes - if a row is wrong,
-- it stays wrong as historical evidence. Old rows can be pruned by a
-- cron job after N days if volume becomes an issue.

CREATE TABLE IF NOT EXISTS admin_access_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  allowed INTEGER NOT NULL CHECK (allowed IN (0, 1)),
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_access_log_user
  ON admin_access_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_access_log_created
  ON admin_access_log (created_at DESC);
