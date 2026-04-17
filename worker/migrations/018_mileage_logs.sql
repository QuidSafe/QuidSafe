-- Mileage tracking for sole traders.
-- HMRC approved mileage rates 2025/26:
--   Cars/vans: 45p first 10,000 miles, 25p thereafter
--   Motorcycles: 24p per mile
--   Bicycles: 20p per mile
CREATE TABLE IF NOT EXISTS mileage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trip_date TEXT NOT NULL,
  description TEXT NOT NULL,
  miles REAL NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car' CHECK(vehicle_type IN ('car', 'motorcycle', 'bicycle')),
  purpose TEXT,
  rate_pence INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mileage_user_date ON mileage_logs(user_id, trip_date DESC);
