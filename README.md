# QuidSafe — Sole Trader Tax Tracker

> **"Set aside £648 this month. That's it."**

QuidSafe is a UK-focused mobile-first app that connects to sole traders' bank accounts via Open Banking, automatically categorises income vs personal spending using AI, and tells them — in plain English — exactly how much to set aside for tax each quarter.

---

## 1. Brand & Naming

### Why "QuidSafe"

| Criteria | Score | Notes |
|----------|-------|-------|
| **Memorable** | ★★★★★ | Two simple words, instantly understood |
| **UK-native** | ★★★★★ | "Quid" is distinctly British slang for £1 |
| **Descriptive** | ★★★★☆ | Implies money ("quid") + security ("safe") — your earnings are protected |
| **Domain availability** | ★★★★★ | quidsafe.co.uk / quidsafe.app likely available |
| **Companies House** | ★★★★★ | No existing "QUIDSAFE" registered (verified Apr 2026) |
| **App Store** | ★★★★★ | No existing app called QuidSafe |
| **Trademark (UKIPO)** | ★★★★☆ | No matching trademark found — verify before filing |

### Alternative Names (Backup)

| Name | Domain | Vibe |
|------|--------|------|
| **TaxNudge** | taxnudge.co.uk | Behavioural, friendly |
| **PennyPilot** | pennypilot.co.uk | Guidance, affordable |
| **NukoTax** | nukotax.co.uk | Modern, techy |
| **SortedTax** | sortedtax.co.uk | British slang, done |

### Brand Identity

- **Tagline:** "Your tax. Sorted. Safe."
- **Voice:** Friendly, plain English, never condescending. Like a smart mate who happens to know about tax.
- **Primary colour:** #0F4C75 (Trust Navy)
- **Accent colour:** #1B9C85 (Growth Green)
- **Typography:** Playfair Display (display) + Manrope (body)
- **Logo concept:** A stylised "Q" forming a coin/pot shape (see `/logo/` directory)

---

## 2. Problem Statement

**5.4 million** sole traders exist in the UK (ONS 2025). The gig economy is growing 15% YoY. Most of these people:

- Have **multiple income streams** (Deliveroo + cleaning + Etsy + tutoring)
- Have **no idea** what they owe until January
- Get hit with **surprise tax bills** of £2,000–£5,000
- Have **no accountant** (too expensive at £500-1,500/yr)
- Are **terrified of HMRC** and Making Tax Digital (MTD)

**QuidSafe solves this** by connecting to their bank, auto-categorising everything, and giving them one number: "Set aside £X this month."

---

## 3. Core Features (MVP)

### Phase 1 — MVP (Months 1-4)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Open Banking connection** | Connect bank via TrueLayer. Read-only. Multi-bank support. | P0 |
| **AI transaction categorisation** | Anonymised AI sorts income vs personal vs business expense | P0 |
| **Tax calculator** | Income Tax + NI (Class 2 & 4) with plain English output | P0 |
| **Dashboard** | Tax owed, expenses claimed, business health indicator, action items | P0 |
| **Expense tracking** | Allowable expenses with receipt scanning (camera), tax saving shown | P0 |
| **Invoicing** | Create, send, track invoices. Overdue/pending/paid statuses. Chase reminders. | P0 |
| **MTD quarterly submissions** | Review screen + submit directly to HMRC via MTD API | P0 |
| **Quarterly timeline** | Visual Q1-Q4 progress tracker with submission status | P0 |
| **Push notifications** | 6 types: deadline, weekly summary, tax pot, MTD ready, invoice overdue, bank re-auth | P1 |
| **Learn section** | Tax education articles: MTD, expenses, VAT, deadlines, bank safety | P1 |
| **Income breakdown** | Gross income, net profit (after expenses), sources with %, monthly chart | P1 |
| **Security dashboard** | Encryption status, biometric lock, AI anonymisation indicator | P1 |
| **HMRC connection** | Government Gateway OAuth in Settings | P1 |
| **Loading/empty/error states** | Skeleton loaders, helpful empty states, error recovery with retry | P1 |
| **Profile & data management** | UTR number, data export (CSV/JSON), account deletion (GDPR) | P1 |

### Phase 2 — Growth (Months 5-8)

| Feature | Description |
|---------|-------------|
| **Mileage tracking** | Auto-log business journeys, 45p/mile HMRC rate |
| **Auto-pot savings** | Auto-transfer tax to savings pot (Monzo/Starling API) |
| **Year-end Self Assessment** | Complete SA100 filing direct to HMRC |
| **Cash flow forecasting** | "You'll run short in March if..." predictions |
| **Business health score** | Growth trends, quarter-on-quarter comparison |
| **VAT threshold alerts** | Warn when approaching £90k turnover |

### Phase 3 — Scale (Months 9-14)

| Feature | Description |
|---------|-------------|
| **Accountant sharing** | Give your accountant read access to your data |
| **Historical comparison** | Year-on-year income and expense trends |
| **SME upgrade path** | When they outgrow sole trader — Ltd company support, payroll |
| **White-label API** | For banks/neobanks to embed QuidSafe features |

---

## 4. Business Model & Unit Economics

### Revenue Model

**No free tier. 14-day free trial. One plan. Everything included.**

| Plan | Price (exc. VAT) | What's Included |
|------|-----------------|-----------------|
| **Monthly** | £9.99/mo | Everything: AI categorisation, MTD submissions, unlimited banks, invoicing, expenses, tax calculator, reminders, plain English insights |
| **Annual** | £89.99/yr (£7.50/mo) | Same — 25% saving for annual commitment |

No tiers. No feature gates. No upsells. Sole traders hate complexity.

### Unit Economics

```
MONTHLY USER (£9.99/mo):
  Revenue:                              £9.99
  Stripe (1.4% + 20p):                -£0.34
  TrueLayer (Open Banking):           -£0.10
  Claude API (anonymised):            -£0.05
  Hosting (Supabase/Vercel share):    -£0.02
  ─────────────────────────────────
  Gross profit:                         £9.48/mo (94.9%)
  After Corporation Tax (25%):          £7.11 net

ANNUAL USER (£89.99/yr = £7.50/mo):
  Revenue:                             £89.99
  Stripe:                              -£1.46
  TrueLayer (12 months):              -£1.20
  Claude API (12 months):             -£0.60
  Hosting (12 months):                -£0.24
  ─────────────────────────────────
  Gross profit:                        £86.49/yr (96.1%)
  After Corporation Tax (25%):         £64.87 net

BLENDED (65% annual, 35% monthly):
  ARPU:                                 £8.37/mo
  Net profit per user after all costs:  £6.16/mo
```

### Revenue Targets

| Paying Users | MRR | ARR | Net After Costs + Tax |
|-------------|-----|-----|----------------------|
| 100 | £837 | £10,044 | ~£616/mo |
| 500 | £4,185 | £50,220 | ~£3,080/mo |
| 1,000 | £8,370 | £100,440 | ~£6,160/mo |
| 2,000 | £16,740 | £200,880 | ~£12,320/mo |
| 5,000 | £41,850 | £502,200 | ~£30,800/mo |
| 10,000 | £83,700 | £1,004,400 | ~£61,600/mo |

VAT registration triggers at ~750 users (~£90k turnover). Price becomes £9.99 + VAT = £11.99 to customer. Still cheapest in market.

### Running Costs (Monthly)

| Category | Month 1-6 | Month 7-12 | Month 13-24 |
|----------|-----------|-----------|-------------|
| **Hosting (AWS/GCP)** | £50 | £150 | £400 |
| **Open Banking API** | £20 | £150 | £600 |
| **AI/LLM API** | £10 | £75 | £300 |
| **Domain + SSL** | £5 | £5 | £5 |
| **Stripe fees** | £17 | £126 | £504 |
| **Email (Resend)** | £0 | £20 | £50 |
| **Error tracking (Sentry)** | £0 | £26 | £26 |
| **Total** | **£102** | **£552** | **£1,885** |

### Startup Costs (One-time)

| Item | Cost |
|------|------|
| Companies House registration | £12 |
| Domain (quidsafe.co.uk + .app) | £20 |
| Apple Developer Program | £79/yr |
| Google Play Console | £20 (one-time) |
| TrueLayer sandbox → production | £0 (pay-per-use) |
| Anthropic API credits | £50 |
| **Total launch costs** | **~£181**|

---

## 5. Technology Architecture

### Tech Stack (Cheapest + Lowest Maintenance)

**One codebase → Web + iOS + Android** using Expo with React Native Web.

| Layer | Technology | Why | Monthly Cost |
|-------|-----------|-----|-------------|
| **Frontend (ALL platforms)** | Expo (SDK 52) + React Native Web | Single codebase builds iOS, Android AND web. One developer maintains everything. | £0 |
| **Backend API** | Cloudflare Workers + Hono | Serverless — zero servers to maintain. Auto-scales. 100k requests/day free. | £0 (free tier) |
| **Database** | Cloudflare D1 (SQLite) | 5GB free tier. Globally replicated reads. Zero config backups. | £0 → £5/mo |
| **Auth** | Clerk | Magic link + Google login. 10k MAU free. Hosted UI + JWT verification. | £0 |
| **Open Banking** | TrueLayer API | UK-focused, FCA regulated, handles all compliance. | ~£0.10/user/mo |
| **AI Categorisation** | Claude API (Haiku 4.5) | Cheapest model, fast, accurate for categorisation. | ~£0.001/request |
| **Payments** | Stripe | Subscriptions, UK cards, SCA-compliant. | 1.4% + 20p |
| **Push Notifications** | Expo Notifications | Free, cross-platform, built into Expo. | £0 |
| **Email** | Resend | 3k emails/mo free. Deadline reminders, receipts. | £0 → £20/mo |
| **Hosting (Web)** | Cloudflare Pages (free tier) | Expo web export as static site. Zero config. Global CDN. | £0 |
| **CDN + DNS** | Cloudflare | Free tier. DDoS protection, SSL, caching. | £0 |
| **CI/CD** | EAS Build + GitHub Actions | Expo Application Services for iOS/Android builds. | £0 (free tier) |
| **Monitoring** | Sentry (free) | Error tracking across all platforms. 5k events/mo free. | £0 |

**Why this is the cheapest:**
- No separate web framework (Next.js eliminated — Expo handles web)
- No separate servers (Supabase Edge Functions = serverless)
- No Redis needed (Supabase handles sessions + RLS handles access)
- No Fly.io/Railway bills (everything serverless or static)
- Total monthly cost at 0-2,000 users: **~£0-20/mo** (just API usage)

**Why this is lowest maintenance:**
- ONE codebase for ALL platforms (not 2 separate apps)
- Supabase manages database, auth, functions, storage, backups
- No servers to patch, scale, or monitor
- EAS Build handles iOS/Android app store submissions
- Over-the-air updates via Expo (skip app store review for JS changes)

### Key API Integrations

| API | Purpose | Cost |
|-----|---------|------|
| **TrueLayer** | Open Banking — read bank transactions | £0.10/connection/mo |
| **HMRC MTD API** | Submit quarterly updates, SA100 | Free (gov API) |
| **Claude API (Haiku)** | Transaction categorisation | ~£0.001/request |
| **Stripe** | Payment processing | 1.4% + 20p per transaction |
| **Resend** | Email notifications | Free up to 3k/mo |

---

## 6. Architecture Diagrams

See `/diagrams/` directory for full Mermaid source files:

- `dev-environment.md` — Local development setup
- `cloud-architecture.md` — Production cloud infrastructure
- `data-flow.md` — How data flows through the system

---

## 7. Competitive Analysis

| Competitor | Price | Weakness | QuidSafe Advantage |
|-----------|-------|----------|-------------------|
| **FreeAgent** | £19-34/mo | Too complex, too expensive for gig workers | 5x cheaper, simpler |
| **QuickBooks SE** | £10-25/mo | Over-featured, American-first | UK-native, MTD-focused |
| **Coconut** | £9/mo | No AI categorisation, manual tagging | Fully automated |
| **Ember** | £39/mo | Aimed at Ltd companies, expensive | Sole trader specialist |
| **HMRC app** | Free | Basic, confusing, no insights | Plain English, proactive |

**QuidSafe's moat:** Cheapest. Simplest. UK-only focus. AI-first categorisation. Plain English.

---

## 8. Regulatory Considerations

| Requirement | Status | Action |
|-------------|--------|--------|
| **FCA Registration** | Required if providing "regulated advice" | Register as Payment Services Agent via TrueLayer (AISP) |
| **GDPR/UK GDPR** | Mandatory | Privacy policy, data processing agreements, right to delete |
| **Open Banking** | Via FCA-regulated provider | TrueLayer handles regulatory burden |
| **PCI DSS** | Not required | Stripe handles all card data |
| **MTD Agent Registration** | Required for HMRC submission | Register as MTD software vendor with HMRC |
| **ICO Registration** | Required | £40/yr data protection fee |

---

## 9. Go-to-Market Strategy

### Target Segments (in priority order)

1. **Deliveroo/Uber drivers** — High volume, clear pain point, online communities
2. **Cleaners/tradespeople** — Cash + bank mix, desperate for help
3. **Etsy/eBay sellers** — Side hustle, don't think of themselves as "business"
4. **Freelance tutors** — Tech-savvy, word-of-mouth networks
5. **Dog walkers/pet sitters** — Growing gig segment

### Channels

| Channel | Strategy | Cost |
|---------|----------|------|
| **TikTok/Reels** | "I asked my app how much tax I owe" — reaction content | £0 |
| **Reddit/Forums** | r/UKPersonalFinance, MSE forums — genuine help | £0 |
| **Facebook Groups** | Deliveroo/Uber driver groups — solve real problems | £0 |
| **SEO** | "How much tax do sole traders pay UK" — content marketing | £0 |
| **Referral program** | Give 1 month free, get 1 month free | Low |
| **Partnerships** | Monzo/Starling marketplace listing | £0 |

---

## 10. File Structure

```
quidsafe/
├── README.md                          # This file
├── docs/
│   ├── BUSINESS_PLAN.md               # Detailed business plan
│   ├── TECHNICAL_SPEC.md              # API specs, data models, endpoints
│   ├── TERMS_OF_SERVICE.md             # Full Terms of Service / T&Cs
│   ├── PRIVACY_POLICY.md              # UK GDPR compliant privacy policy
│   ├── ACCESSIBILITY.md               # WCAG 2.1 AA accessibility statement
│   ├── SECURITY.md                    # Security architecture, AI anonymisation, encryption
│   ├── TAX_RULES.md                   # Current tax rates, MTD rules, HMRC source links, upcoming changes
│   ├── HOW_TO_USE.md                  # Step-by-step user guide, what happens after submission
│   ├── REGULATORY.md                  # GDPR, MTD compliance guide (no FCA needed)
│   └── GO_TO_MARKET.md               # Marketing & launch strategy
├── prompts/
│   ├── 01-PROJECT_SETUP.md            # Claude Code: scaffold the project
│   ├── 02-DATABASE_SCHEMA.md          # Claude Code: design the database
│   ├── 03-AUTH_AND_ONBOARDING.md      # Claude Code: auth flow
│   ├── 04-OPEN_BANKING.md            # Claude Code: TrueLayer integration
│   ├── 05-AI_CATEGORISATION.md       # Claude Code: transaction categoriser
│   ├── 06-TAX_CALCULATOR.md          # Claude Code: UK tax engine
│   ├── 07-DASHBOARD_UI.md            # Claude Code: main dashboard
│   ├── 08-NOTIFICATIONS.md           # Claude Code: reminders & alerts
│   ├── 09-PAYMENTS.md                # Claude Code: Stripe subscriptions
│   ├── 10-MTD_SUBMISSION.md          # Claude Code: HMRC MTD API
│   └── 11-DEPLOYMENT.md              # Claude Code: CI/CD & hosting
├── diagrams/
│   ├── dev-environment.md             # Mermaid: local dev setup
│   ├── cloud-architecture.md          # Mermaid: production infrastructure
│   └── data-flow.md                   # Mermaid: system data flow
├── logo/
│   └── LOGO_BRIEF.md                 # Logo design brief for designers
└── src/                               # Source code (generated by prompts)
    ├── app/                           # Expo Router (file-based routing)
    │   ├── (auth)/                    # Auth screens (login, signup)
    │   ├── (tabs)/                    # Main tab navigation
    │   │   ├── index.tsx              # Dashboard
    │   │   ├── income.tsx             # Income breakdown
    │   │   ├── learn.tsx              # Tax education
    │   │   └── settings.tsx           # Settings
    │   ├── onboarding/                # Onboarding flow
    │   └── _layout.tsx                # Root layout
    ├── components/                    # Shared UI components
    ├── lib/
    │   ├── supabase.ts                # Supabase client
    │   ├── tax-engine.ts              # UK tax calculations
    │   └── categoriser.ts             # AI categorisation client
    ├── supabase/
    │   ├── migrations/                # Database migrations
    │   └── functions/                 # Supabase Edge Functions (API)
    │       ├── banking-sync/          # TrueLayer sync
    │       ├── categorise/            # Claude AI categorisation
    │       ├── tax-calculate/         # Tax computation
    │       ├── stripe-webhook/        # Payment handling
    │       └── mtd-submit/            # HMRC submission
```

---

## 11. Getting Started

### Prerequisites

- Node.js 20+
- Wrangler CLI (included as dev dependency — `npx wrangler`)
- Cloudflare account (free tier — Workers + D1)
- Clerk account (free tier — auth)
- GitHub account
- TrueLayer sandbox account (free)
- Xcode (for iOS simulator, Mac only)
- Android Studio (for Android emulator, optional)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/quidsafe.git
cd quidsafe

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Create D1 database (first time only)
npx wrangler d1 create quidsafe-dev

# Run D1 migrations
npx wrangler d1 migrations apply quidsafe-dev --local

# Start the Worker API (http://localhost:8787)
npx wrangler dev

# In a new terminal — start the app (web + mobile)
npx expo start
# → Press 'w' for web browser
# → Press 'i' for iOS simulator
# → Press 'a' for Android emulator
```

**Two processes. All 3 platforms + API running. £0 cost.**

---

## License

MIT — Build freely, help sole traders.
