CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('mtd', 'expenses', 'vat', 'deadlines', 'bank-safety', 'getting-started')),
  read_time_min INTEGER NOT NULL DEFAULT 5,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with existing hardcoded articles

INSERT INTO articles (id, title, summary, body, category, read_time_min, published_at) VALUES
(
  'what-is-mtd',
  'What is Making Tax Digital?',
  'Quarterly updates instead of one January panic...',
  'Making Tax Digital (MTD) for Income Tax requires sole traders earning over £50,000 to keep digital records and submit quarterly updates to HMRC using compatible software. From April 2026, this threshold drops to £30,000. QuidSafe automatically tracks your income and expenses so you are MTD-ready from day one.',
  'mtd',
  3,
  '2025-01-15T10:00:00'
),
(
  'how-much-tax',
  'How much tax do I actually owe?',
  'Personal allowance, basic rate, NI...',
  'As a sole trader you pay Income Tax on profits above the £12,570 Personal Allowance. The basic rate is 20% on earnings from £12,571 to £50,270, then 40% up to £125,140. You also pay Class 2 and Class 4 National Insurance. QuidSafe calculates your estimated liability in real time so there are no surprises.',
  'getting-started',
  4,
  '2025-01-14T10:00:00'
),
(
  'what-expenses-can-i-claim',
  'What expenses can I claim?',
  'Fuel, phone, home office...',
  'You can claim allowable expenses that are wholly and exclusively for your business. Common claims include office supplies, travel costs, phone bills (business portion), professional subscriptions, and use-of-home. Keep receipts and records for at least five years in case HMRC enquires.',
  'expenses',
  5,
  '2025-01-13T10:00:00'
),
(
  'is-connecting-bank-safe',
  'Is connecting my bank safe?',
  'FCA regulated, read-only, UK servers...',
  'QuidSafe uses TrueLayer, an FCA-authorised Open Banking provider. The connection is read-only, meaning no one can move money from your account. Your credentials are never shared with us, and all data is encrypted at rest using AES-256-GCM on UK-based servers.',
  'bank-safety',
  2,
  '2025-01-12T10:00:00'
),
(
  'key-dates',
  'Key dates you can''t miss',
  'Quarterly submissions, payment deadlines...',
  'The Self Assessment tax return deadline is 31 January for online filing. Payments on account are due 31 January and 31 July. Under MTD, quarterly updates are due on the 5th of August, November, February, and May. Missing deadlines triggers automatic penalties starting at £100.',
  'deadlines',
  2,
  '2025-01-11T10:00:00'
),
(
  'when-register-for-vat',
  'When do I need to register for VAT?',
  'The £90k threshold, voluntary registration...',
  'You must register for VAT if your taxable turnover exceeds £90,000 in a rolling 12-month period, or you expect to exceed it in the next 30 days alone. Voluntary registration below the threshold can be worthwhile if most of your customers are VAT-registered businesses, as you can reclaim VAT on purchases.',
  'vat',
  3,
  '2025-01-10T10:00:00'
);
