# Prompt 02 — Database Schema & Migrations

## Context
QuidSafe monorepo is scaffolded. Now design the database schema using Cloudflare D1 (SQLite). The app tracks: users, bank connections, transactions, expenses, tax calculations, MTD submissions, invoices, subscriptions, and push notification devices.

## Stack
- **Database:** Cloudflare D1 (SQLite at the edge — globally replicated, zero config backups)
- **Migrations:** Raw SQL files in `worker/migrations/` applied via `wrangler d1 migrations apply`
- **Auth IDs:** Clerk user IDs (text PKs, not UUIDs)
- **Encryption:** AES-256-GCM for sensitive tokens (via `worker/utils/crypto.ts`)
- **No ORM:** Direct D1 prepared statements for performance and simplicity

## Task
Create the complete D1 schema across two migration files in `worker/migrations/`.

## Migration 001 — Core Tables (`worker/migrations/001_initial.sql`)

### `users` table
- `id` (TEXT PK) — Clerk user ID
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT, default '')
- `subscription_tier` (TEXT, CHECK 'free'|'pro', default 'free')
- `onboarding_completed` (INTEGER, 0|1, default 0)
- `stripe_customer_id` (TEXT, nullable)
- `created_at`, `updated_at` (TEXT, ISO 8601, default datetime('now'))

### `categories` table (seeded with HMRC-allowable categories)
- `id` (INTEGER PK AUTOINCREMENT)
- `slug` (TEXT, UNIQUE) — e.g. 'office_supplies', 'travel', 'income'
- `name` (TEXT) — Display name
- `type` (TEXT, CHECK 'income'|'personal'|'business_expense')
- `hmrc_category` (TEXT, nullable) — HMRC allowable category mapping
- `description` (TEXT, nullable)
- `created_at` (TEXT)

**Seed data:** income, personal, office_supplies, travel, phone_internet, professional, marketing, clothing, training, vehicle

### `transactions` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `amount` (REAL) — Positive = credit, negative = debit
- `description` (TEXT, default '')
- `merchant_name` (TEXT, nullable)
- `category_id` (INTEGER, FK -> categories, nullable)
- `ai_category` (TEXT, CHECK 'income'|'personal'|'business_expense', nullable)
- `ai_confidence` (REAL, 0.0–1.0, nullable)
- `user_override` (INTEGER, 0|1, default 0) — 1 if user manually recategorised
- `is_income` (INTEGER, 0|1, default 0)
- `income_source` (TEXT, nullable) — e.g. 'Deliveroo', 'Etsy'
- `bank_connection_id` (TEXT, nullable)
- `bank_transaction_id` (TEXT, nullable) — External ID from TrueLayer
- `transaction_date` (TEXT, ISO 8601 date)
- `created_at` (TEXT)

**Indexes:** `(user_id)`, `(user_id, transaction_date)`, `(user_id, ai_category)`

### `tax_estimates` table
- `id` (INTEGER PK AUTOINCREMENT)
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `tax_year` (TEXT) — e.g. '2026/27'
- `quarter` (INTEGER, 0–4) — 0 = full year
- `total_income`, `total_expenses`, `taxable_income` (REAL, default 0)
- `income_tax`, `ni_class2`, `ni_class4`, `total_tax_owed` (REAL, default 0)
- `set_aside_monthly` (REAL, default 0) — total_tax / months_remaining
- `plain_english` (TEXT) — Human-readable tax summary
- `calculated_at` (TEXT)

**Indexes:** `(user_id)`, `(user_id, tax_year, quarter)`

## Migration 002 — Full Schema (`worker/migrations/002_full_schema.sql`)

### `bank_connections` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `provider` (TEXT, default 'truelayer')
- `bank_name` (TEXT) — e.g. 'Monzo', 'Starling'
- `access_token_encrypted` (TEXT) — AES-256-GCM encrypted
- `refresh_token_encrypted` (TEXT) — AES-256-GCM encrypted
- `consent_expires_at` (TEXT, nullable)
- `last_synced_at` (TEXT, nullable)
- `active` (INTEGER, 0|1, default 1)
- `created_at` (TEXT)

### `mtd_submissions` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `tax_year` (TEXT) — e.g. '2026/27'
- `quarter` (INTEGER, 1–4)
- `hmrc_receipt_id` (TEXT, nullable)
- `status` (TEXT, CHECK 'draft'|'submitted'|'accepted'|'rejected', default 'draft')
- `payload_json` (TEXT, default '{}') — JSON string of what was sent
- `response_json` (TEXT, nullable) — JSON string of HMRC response
- `submitted_at` (TEXT, nullable)
- `created_at` (TEXT)

### `subscriptions` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, UNIQUE, FK -> users, CASCADE DELETE)
- `stripe_customer_id` (TEXT)
- `stripe_subscription_id` (TEXT, nullable)
- `plan` (TEXT, CHECK 'free'|'pro_monthly'|'pro_annual', default 'free')
- `status` (TEXT, CHECK 'active'|'past_due'|'cancelled'|'trialing', default 'trialing')
- `trial_ends_at` (TEXT, nullable)
- `current_period_start` (TEXT, nullable)
- `current_period_end` (TEXT, nullable)
- `created_at` (TEXT)

### `category_corrections` table (AI learning signal)
- `id` (INTEGER PK AUTOINCREMENT)
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `transaction_id` (TEXT, FK -> transactions, CASCADE DELETE)
- `original_category` (TEXT) — What AI predicted
- `corrected_category` (TEXT) — What user chose
- `merchant_name` (TEXT, nullable) — For pattern matching
- `created_at` (TEXT)

### `expenses` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `amount` (REAL)
- `description` (TEXT, default '')
- `category_id` (INTEGER, FK -> categories, nullable)
- `hmrc_category` (TEXT, nullable)
- `receipt_url` (TEXT, nullable)
- `date` (TEXT, ISO 8601)
- `created_at` (TEXT)

### `invoices` table
- `id` (TEXT PK) — UUID
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `client_name` (TEXT)
- `client_email` (TEXT, nullable)
- `amount` (REAL)
- `description` (TEXT, default '')
- `status` (TEXT, CHECK 'draft'|'sent'|'paid'|'overdue', default 'draft')
- `due_date` (TEXT)
- `paid_at` (TEXT, nullable)
- `created_at` (TEXT)

### `user_devices` table (push notifications)
- `id` (INTEGER PK AUTOINCREMENT)
- `user_id` (TEXT, FK -> users, CASCADE DELETE)
- `push_token` (TEXT)
- `platform` (TEXT, CHECK 'ios'|'android'|'web')
- `active` (INTEGER, 0|1, default 1)
- `created_at` (TEXT)

### ALTER TABLE additions to `transactions`
- `currency` (TEXT, default 'GBP')
- `raw_category` (TEXT) — Original category from bank
- `ai_reasoning` (TEXT) — Short explanation of AI categorisation
- `is_expense_claimable` (INTEGER, 0|1, default 0)

## Indexes (across both migrations)

| Table | Index | Columns |
|-------|-------|---------|
| users | idx_users_email | `email` |
| transactions | idx_transactions_user | `user_id` |
| transactions | idx_transactions_date | `user_id, transaction_date` |
| transactions | idx_transactions_category | `user_id, ai_category` |
| tax_estimates | idx_tax_estimates_user | `user_id` |
| tax_estimates | idx_tax_estimates_year | `user_id, tax_year, quarter` |
| bank_connections | idx_bank_connections_user | `user_id` |
| mtd_submissions | idx_mtd_submissions_user | `user_id` |
| mtd_submissions | idx_mtd_submissions_year | `user_id, tax_year, quarter` |
| subscriptions | idx_subscriptions_stripe | `stripe_customer_id` |
| category_corrections | idx_corrections_merchant | `merchant_name` |
| expenses | idx_expenses_user | `user_id` |
| expenses | idx_expenses_date | `user_id, date` |
| invoices | idx_invoices_user | `user_id` |
| invoices | idx_invoices_status | `user_id, status` |
| user_devices | idx_user_devices_user | `user_id` |

## D1 / SQLite Considerations
- No ENUM type — use TEXT with CHECK constraints
- No BOOLEAN type — use INTEGER (0 = false, 1 = true)
- No native UUID type — use TEXT with application-generated UUIDs
- No JSONB — use TEXT columns storing JSON strings
- Timestamps stored as TEXT in ISO 8601 format, default `datetime('now')`
- Foreign key cascades handled by SQLite's `ON DELETE CASCADE`
- No Row Level Security — auth enforcement via Clerk JWT middleware (`worker/middleware/auth.ts`)

## Applying Migrations

```bash
# Local development
npx wrangler d1 migrations apply quidsafe-staging --local

# Remote staging
npx wrangler d1 migrations apply quidsafe-staging --remote

# Remote production
npx wrangler d1 migrations apply quidsafe-production --remote --env production
```

## Output
All migration SQL files in `worker/migrations/`, with seeded categories and proper indexes.
