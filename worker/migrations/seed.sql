-- QuidSafe Seed Data - 1 test user, 1 bank connection, 50 sample transactions
-- Usage: npx wrangler d1 execute quidsafe-staging --local --file=worker/migrations/seed.sql

-- ─── Test User ────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, email, name, subscription_tier, onboarding_completed, created_at, updated_at)
VALUES ('user_test_001', 'test@quidsafe.co.uk', 'Sarah Thompson', 'pro', 1, datetime('now'), datetime('now'));

-- ─── Bank Connection ─────────────────────────────────────
INSERT OR IGNORE INTO bank_connections (id, user_id, provider, bank_name, access_token_encrypted, refresh_token_encrypted, last_synced_at, active, created_at)
VALUES ('bc_test_001', 'user_test_001', 'truelayer', 'Monzo', 'encrypted_access_token_placeholder', 'encrypted_refresh_token_placeholder', datetime('now'), 1, datetime('now'));

-- ─── 50 Sample Transactions (3 months: Jan-Mar 2026) ─────
-- Income transactions (15)
INSERT INTO transactions (id, user_id, amount, description, merchant_name, ai_category, ai_confidence, is_income, income_source, bank_connection_id, transaction_date, created_at)
VALUES
  ('tx_001', 'user_test_001', 450.00, 'Deliveroo driver payment', 'Deliveroo', 'income', 0.98, 1, 'Deliveroo', 'bc_test_001', '2026-01-05', datetime('now')),
  ('tx_002', 'user_test_001', 380.00, 'Deliveroo driver payment', 'Deliveroo', 'income', 0.98, 1, 'Deliveroo', 'bc_test_001', '2026-01-12', datetime('now')),
  ('tx_003', 'user_test_001', 520.00, 'Uber Eats payment', 'Uber', 'income', 0.97, 1, 'Uber', 'bc_test_001', '2026-01-19', datetime('now')),
  ('tx_004', 'user_test_001', 200.00, 'Cleaning - Mrs Johnson', NULL, 'income', 0.92, 1, 'Cleaning', 'bc_test_001', '2026-01-22', datetime('now')),
  ('tx_005', 'user_test_001', 200.00, 'Cleaning - Mr Patel', NULL, 'income', 0.91, 1, 'Cleaning', 'bc_test_001', '2026-01-29', datetime('now')),
  ('tx_006', 'user_test_001', 490.00, 'Deliveroo driver payment', 'Deliveroo', 'income', 0.98, 1, 'Deliveroo', 'bc_test_001', '2026-02-02', datetime('now')),
  ('tx_007', 'user_test_001', 600.00, 'Freelance web project', NULL, 'income', 0.95, 1, 'Freelance', 'bc_test_001', '2026-02-10', datetime('now')),
  ('tx_008', 'user_test_001', 410.00, 'Uber Eats payment', 'Uber', 'income', 0.97, 1, 'Uber', 'bc_test_001', '2026-02-15', datetime('now')),
  ('tx_009', 'user_test_001', 200.00, 'Cleaning - Mrs Johnson', NULL, 'income', 0.92, 1, 'Cleaning', 'bc_test_001', '2026-02-20', datetime('now')),
  ('tx_010', 'user_test_001', 350.00, 'Etsy sales payout', 'Etsy', 'income', 0.96, 1, 'Etsy', 'bc_test_001', '2026-02-28', datetime('now')),
  ('tx_011', 'user_test_001', 530.00, 'Deliveroo driver payment', 'Deliveroo', 'income', 0.98, 1, 'Deliveroo', 'bc_test_001', '2026-03-01', datetime('now')),
  ('tx_012', 'user_test_001', 480.00, 'Uber Eats payment', 'Uber', 'income', 0.97, 1, 'Uber', 'bc_test_001', '2026-03-08', datetime('now')),
  ('tx_013', 'user_test_001', 200.00, 'Cleaning - Mrs Johnson', NULL, 'income', 0.92, 1, 'Cleaning', 'bc_test_001', '2026-03-15', datetime('now')),
  ('tx_014', 'user_test_001', 750.00, 'Freelance web project', NULL, 'income', 0.95, 1, 'Freelance', 'bc_test_001', '2026-03-20', datetime('now')),
  ('tx_015', 'user_test_001', 200.00, 'Cleaning - Mr Patel', NULL, 'income', 0.91, 1, 'Cleaning', 'bc_test_001', '2026-03-28', datetime('now'));

-- Business expense transactions (15)
INSERT INTO transactions (id, user_id, amount, description, merchant_name, ai_category, ai_confidence, is_income, is_expense_claimable, bank_connection_id, transaction_date, created_at)
VALUES
  ('tx_016', 'user_test_001', -45.99, 'Petrol - Shell', 'Shell', 'business_expense', 0.88, 0, 1, 'bc_test_001', '2026-01-03', datetime('now')),
  ('tx_017', 'user_test_001', -12.99, 'Phone case - Amazon', 'Amazon', 'business_expense', 0.72, 0, 1, 'bc_test_001', '2026-01-08', datetime('now')),
  ('tx_018', 'user_test_001', -35.00, 'Phone bill - EE', 'EE', 'business_expense', 0.85, 0, 1, 'bc_test_001', '2026-01-15', datetime('now')),
  ('tx_019', 'user_test_001', -89.99, 'Insurance premium', 'Hiscox', 'business_expense', 0.93, 0, 1, 'bc_test_001', '2026-01-20', datetime('now')),
  ('tx_020', 'user_test_001', -15.00, 'Parking - NCP', 'NCP', 'business_expense', 0.80, 0, 1, 'bc_test_001', '2026-01-25', datetime('now')),
  ('tx_021', 'user_test_001', -49.99, 'Petrol - BP', 'BP', 'business_expense', 0.88, 0, 1, 'bc_test_001', '2026-02-01', datetime('now')),
  ('tx_022', 'user_test_001', -24.99, 'Cleaning supplies - Screwfix', 'Screwfix', 'business_expense', 0.82, 0, 1, 'bc_test_001', '2026-02-07', datetime('now')),
  ('tx_023', 'user_test_001', -35.00, 'Phone bill - EE', 'EE', 'business_expense', 0.85, 0, 1, 'bc_test_001', '2026-02-15', datetime('now')),
  ('tx_024', 'user_test_001', -120.00, 'Accountant fee', 'TaxAssist', 'business_expense', 0.96, 0, 1, 'bc_test_001', '2026-02-20', datetime('now')),
  ('tx_025', 'user_test_001', -8.50, 'Parking - NCP', 'NCP', 'business_expense', 0.80, 0, 1, 'bc_test_001', '2026-02-25', datetime('now')),
  ('tx_026', 'user_test_001', -52.00, 'Petrol - Shell', 'Shell', 'business_expense', 0.88, 0, 1, 'bc_test_001', '2026-03-02', datetime('now')),
  ('tx_027', 'user_test_001', -19.99, 'Printer ink - Argos', 'Argos', 'business_expense', 0.78, 0, 1, 'bc_test_001', '2026-03-10', datetime('now')),
  ('tx_028', 'user_test_001', -35.00, 'Phone bill - EE', 'EE', 'business_expense', 0.85, 0, 1, 'bc_test_001', '2026-03-15', datetime('now')),
  ('tx_029', 'user_test_001', -150.00, 'Training course - Udemy', 'Udemy', 'business_expense', 0.90, 0, 1, 'bc_test_001', '2026-03-18', datetime('now')),
  ('tx_030', 'user_test_001', -42.00, 'Petrol - Tesco', 'Tesco', 'business_expense', 0.87, 0, 1, 'bc_test_001', '2026-03-25', datetime('now'));

-- Personal transactions (20)
INSERT INTO transactions (id, user_id, amount, description, merchant_name, ai_category, ai_confidence, is_income, bank_connection_id, transaction_date, created_at)
VALUES
  ('tx_031', 'user_test_001', -4.50, 'Coffee - Costa', 'Costa Coffee', 'personal', 0.95, 0, 'bc_test_001', '2026-01-02', datetime('now')),
  ('tx_032', 'user_test_001', -65.00, 'Weekly shop - Tesco', 'Tesco', 'personal', 0.97, 0, 'bc_test_001', '2026-01-04', datetime('now')),
  ('tx_033', 'user_test_001', -12.99, 'Netflix subscription', 'Netflix', 'personal', 0.99, 0, 'bc_test_001', '2026-01-07', datetime('now')),
  ('tx_034', 'user_test_001', -35.00, 'Gym membership', 'PureGym', 'personal', 0.98, 0, 'bc_test_001', '2026-01-10', datetime('now')),
  ('tx_035', 'user_test_001', -22.50, 'Takeaway - Just Eat', 'Just Eat', 'personal', 0.96, 0, 'bc_test_001', '2026-01-14', datetime('now')),
  ('tx_036', 'user_test_001', -70.00, 'Weekly shop - Sainsburys', 'Sainsburys', 'personal', 0.97, 0, 'bc_test_001', '2026-01-18', datetime('now')),
  ('tx_037', 'user_test_001', -850.00, 'Rent payment', 'Landlord', 'personal', 0.99, 0, 'bc_test_001', '2026-01-31', datetime('now')),
  ('tx_038', 'user_test_001', -5.20, 'Coffee - Pret', 'Pret A Manger', 'personal', 0.95, 0, 'bc_test_001', '2026-02-03', datetime('now')),
  ('tx_039', 'user_test_001', -58.00, 'Weekly shop - Aldi', 'Aldi', 'personal', 0.97, 0, 'bc_test_001', '2026-02-06', datetime('now')),
  ('tx_040', 'user_test_001', -12.99, 'Netflix subscription', 'Netflix', 'personal', 0.99, 0, 'bc_test_001', '2026-02-07', datetime('now')),
  ('tx_041', 'user_test_001', -35.00, 'Gym membership', 'PureGym', 'personal', 0.98, 0, 'bc_test_001', '2026-02-10', datetime('now')),
  ('tx_042', 'user_test_001', -850.00, 'Rent payment', 'Landlord', 'personal', 0.99, 0, 'bc_test_001', '2026-02-28', datetime('now')),
  ('tx_043', 'user_test_001', -4.80, 'Coffee - Starbucks', 'Starbucks', 'personal', 0.95, 0, 'bc_test_001', '2026-03-01', datetime('now')),
  ('tx_044', 'user_test_001', -72.00, 'Weekly shop - Tesco', 'Tesco', 'personal', 0.97, 0, 'bc_test_001', '2026-03-05', datetime('now')),
  ('tx_045', 'user_test_001', -12.99, 'Netflix subscription', 'Netflix', 'personal', 0.99, 0, 'bc_test_001', '2026-03-07', datetime('now')),
  ('tx_046', 'user_test_001', -35.00, 'Gym membership', 'PureGym', 'personal', 0.98, 0, 'bc_test_001', '2026-03-10', datetime('now')),
  ('tx_047', 'user_test_001', -18.00, 'Takeaway - Deliveroo', 'Deliveroo', 'personal', 0.94, 0, 'bc_test_001', '2026-03-14', datetime('now')),
  ('tx_048', 'user_test_001', -45.00, 'Haircut', 'Barbers', 'personal', 0.97, 0, 'bc_test_001', '2026-03-17', datetime('now')),
  ('tx_049', 'user_test_001', -850.00, 'Rent payment', 'Landlord', 'personal', 0.99, 0, 'bc_test_001', '2026-03-31', datetime('now')),
  ('tx_050', 'user_test_001', -28.00, 'Drinks - Wetherspoons', 'Wetherspoons', 'personal', 0.96, 0, 'bc_test_001', '2026-03-22', datetime('now'));

-- ─── Subscription ─────────────────────────────────────────
INSERT OR IGNORE INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, created_at)
VALUES ('sub_test_001', 'user_test_001', 'cus_test_001', 'sub_stripe_test_001', 'pro_monthly', 'active', datetime('now', '-15 days'), datetime('now', '+15 days'), datetime('now'));
