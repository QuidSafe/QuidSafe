-- Rate limiting table for API abuse prevention
-- Tracks request counts per client IP + limit type within time windows
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
