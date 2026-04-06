-- Add MTD submission ready notification preference
ALTER TABLE users ADD COLUMN notify_mtd_ready INTEGER NOT NULL DEFAULT 1;
