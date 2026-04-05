# Prompt 02 — Database Schema & Migrations

## Context
QuidSafe monorepo is scaffolded. Now design the database schema using Drizzle ORM with PostgreSQL. The app tracks: users, bank connections, transactions, tax calculations, MTD submissions, and subscriptions.

## Task
Create the complete Drizzle schema and initial migration in `packages/db/`.

## Schema Requirements

### `users` table
- `id` (UUID, PK, default gen_random_uuid)
- `email` (text, unique, not null)
- `name` (text)
- `supabase_auth_id` (text, unique) — links to Supabase Auth
- `subscription_tier` (enum: 'free', 'pro') default 'free'
- `onboarding_completed` (boolean, default false)
- `tax_year_start` (date) — defaults to current UK tax year start (6 April)
- `created_at`, `updated_at` (timestamps)

### `bank_connections` table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users, cascade delete)
- `provider` (text) — 'truelayer'
- `bank_name` (text) — e.g. 'Monzo', 'Starling'
- `access_token_encrypted` (text) — AES-256 encrypted
- `refresh_token_encrypted` (text)
- `consent_expires_at` (timestamp)
- `last_synced_at` (timestamp)
- `active` (boolean, default true)
- `created_at` (timestamp)

### `transactions` table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users, cascade delete)
- `connection_id` (UUID, FK → bank_connections)
- `external_id` (text, unique) — TrueLayer transaction ID
- `amount` (decimal 10,2)
- `currency` (text, default 'GBP')
- `description` (text)
- `merchant_name` (text, nullable)
- `raw_category` (text) — from bank
- `ai_category` (text) — from Claude: 'income', 'personal', 'business_expense'
- `ai_confidence` (real) — 0.0 to 1.0
- `ai_reasoning` (text, nullable) — short explanation
- `is_income` (boolean, default false)
- `is_expense_claimable` (boolean, default false)
- `income_source` (text, nullable) — e.g. 'Uber', 'Etsy', 'Cleaning'
- `transaction_date` (date)
- `created_at` (timestamp)

### `tax_calculations` table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `tax_year` (text) — e.g. '2026/27'
- `quarter` (integer) — 1-4
- `total_income` (decimal 10,2)
- `total_expenses` (decimal 10,2)
- `personal_allowance_used` (decimal 10,2)
- `taxable_income` (decimal 10,2)
- `income_tax` (decimal 10,2)
- `ni_class2` (decimal 10,2)
- `ni_class4` (decimal 10,2)
- `total_tax_owed` (decimal 10,2)
- `set_aside_monthly` (decimal 10,2) — total_tax / months_remaining
- `calculated_at` (timestamp)

### `mtd_submissions` table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `tax_year` (text)
- `quarter` (integer)
- `hmrc_receipt_id` (text, nullable)
- `status` (enum: 'draft', 'submitted', 'accepted', 'rejected')
- `payload_json` (jsonb) — what was sent to HMRC
- `response_json` (jsonb, nullable) — HMRC response
- `submitted_at` (timestamp, nullable)
- `created_at` (timestamp)

### `subscriptions` table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users, unique)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text, nullable)
- `plan` (enum: 'free', 'pro_monthly', 'pro_annual')
- `status` (enum: 'active', 'past_due', 'cancelled', 'trialing')
- `current_period_start` (timestamp)
- `current_period_end` (timestamp)
- `created_at` (timestamp)

## Additional Requirements
- Enable Row Level Security policies on all tables (user_id = auth.uid())
- Add indexes on: `transactions.user_id`, `transactions.transaction_date`, `transactions.is_income`, `tax_calculations.user_id + tax_year`
- Create a seed script with 1 test user, 1 bank connection, and 50 sample transactions across 3 months
- Use Drizzle's `drizzle-kit` for migration generation

## Output
All schema files in `packages/db/src/schema/`, migration SQL, and seed script.
