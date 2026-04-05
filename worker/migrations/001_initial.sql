-- QuidSafe D1 Schema — Initial migration
-- Tables: users, transactions, categories, tax_estimates

-- ─── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                              -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  subscription_tier TEXT NOT NULL DEFAULT 'free'     -- 'free' | 'pro'
    CHECK (subscription_tier IN ('free', 'pro')),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- ─── Categories ───────────────────────────────────────────
-- HMRC-allowable expense categories + income/personal
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,                         -- e.g. 'office_supplies', 'travel', 'income'
  name TEXT NOT NULL,                                -- Display name
  type TEXT NOT NULL                                 -- 'income' | 'personal' | 'business_expense'
    CHECK (type IN ('income', 'personal', 'business_expense')),
  hmrc_category TEXT,                                -- HMRC allowable category mapping
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default categories
INSERT INTO categories (slug, name, type, hmrc_category, description) VALUES
  ('income',           'Income',                  'income',           NULL,                     'Business income from clients or sales'),
  ('personal',         'Personal',                'personal',         NULL,                     'Personal spending — not deductible'),
  ('office_supplies',  'Office Supplies',         'business_expense', 'Office, property and equipment', 'Stationery, printer ink, software subscriptions'),
  ('travel',           'Travel',                  'business_expense', 'Travel costs',           'Public transport, fuel, parking for business'),
  ('phone_internet',   'Phone & Internet',        'business_expense', 'Office, property and equipment', 'Business portion of phone/broadband bills'),
  ('professional',     'Professional Services',   'business_expense', 'Legal and financial costs', 'Accountant fees, legal advice, insurance'),
  ('marketing',        'Marketing & Advertising', 'business_expense', 'Marketing, entertainment and subscriptions', 'Ads, website hosting, business cards'),
  ('clothing',         'Uniforms & Workwear',     'business_expense', 'Clothing expenses',      'Required uniforms or protective clothing'),
  ('training',         'Training & Development',  'business_expense', 'Training courses',       'Courses and qualifications for your trade'),
  ('vehicle',          'Vehicle Expenses',        'business_expense', 'Car, van and travel expenses', 'Fuel, insurance, repairs for business vehicle');

-- ─── Transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,                              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,                             -- Positive = credit, negative = debit
  description TEXT NOT NULL DEFAULT '',
  merchant_name TEXT,
  category_id INTEGER REFERENCES categories(id),
  ai_category TEXT                                  -- 'income' | 'personal' | 'business_expense'
    CHECK (ai_category IS NULL OR ai_category IN ('income', 'personal', 'business_expense')),
  ai_confidence REAL,                               -- 0.0 to 1.0
  user_override INTEGER NOT NULL DEFAULT 0,         -- 1 if user manually recategorised
  is_income INTEGER NOT NULL DEFAULT 0,             -- 0 = false, 1 = true
  income_source TEXT,                               -- e.g. 'Deliveroo', 'Etsy'
  bank_connection_id TEXT,
  bank_transaction_id TEXT,                         -- External ID from TrueLayer
  transaction_date TEXT NOT NULL,                   -- ISO 8601 date
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_category ON transactions(user_id, ai_category);

-- ─── Tax Estimates ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,                           -- e.g. '2026/27'
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 0 AND 4), -- 0 = full year
  total_income REAL NOT NULL DEFAULT 0,
  total_expenses REAL NOT NULL DEFAULT 0,
  taxable_income REAL NOT NULL DEFAULT 0,
  income_tax REAL NOT NULL DEFAULT 0,
  ni_class2 REAL NOT NULL DEFAULT 0,
  ni_class4 REAL NOT NULL DEFAULT 0,
  total_tax_owed REAL NOT NULL DEFAULT 0,
  set_aside_monthly REAL NOT NULL DEFAULT 0,
  plain_english TEXT NOT NULL DEFAULT '',
  calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tax_estimates_user ON tax_estimates(user_id);
CREATE INDEX idx_tax_estimates_year ON tax_estimates(user_id, tax_year, quarter);
