-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN notify_tax_deadlines INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_weekly_summary INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_transaction_alerts INTEGER NOT NULL DEFAULT 0;
