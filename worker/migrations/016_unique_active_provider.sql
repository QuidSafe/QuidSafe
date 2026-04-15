-- Prevent duplicate active connections per provider per user.
-- Without this, double-clicks during HMRC OAuth flow can create
-- two active rows; queries using .first() then return a stale row.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_connections_user_provider_active
  ON bank_connections(user_id, provider) WHERE active = 1;
