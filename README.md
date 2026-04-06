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

### Brand Identity

- **Tagline:** "Your tax. Sorted. Safe."
- **Voice:** Friendly, plain English, never condescending. Like a smart mate who happens to know about tax.
- **Primary colour:** #0F172A (Trust Navy)
- **Secondary colour:** #1E3A8A (Royal Blue)
- **Accent colour:** #CA8A04 (Warm Gold)
- **Success colour:** #16A34A (Success Green)
- **Typography:** Playfair Display (headings) + Manrope (body)
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
| **Dashboard** | Hero card with tax owed, gold set-aside card, action items, income source bars | P0 |
| **Expense tracking** | Allowable expenses with receipt scanning (camera), claimed badges, tax saving shown | P0 |
| **Invoicing** | Create, send, track invoices. Overdue/pending/paid statuses. Chase reminders. | P0 |
| **MTD quarterly submissions** | Review screen + submit directly to HMRC via MTD API | P0 |
| **Quarterly timeline** | Visual Q1-Q4 progress tracker with submission status | P0 |
| **Push notifications** | 6 types: deadline, weekly summary, tax pot, MTD ready, invoice overdue, bank re-auth | P1 |
| **Learn section** | Tax education articles with colored tags: MTD, expenses, VAT, deadlines, bank safety | P1 |
| **Income breakdown** | Gross income, net profit, bar chart, source list with icons and % breakdown | P1 |
| **Security dashboard** | Encryption status, biometric lock, AI anonymisation indicator | P1 |
| **Settings** | Grouped rows with icons, toggles, theme selection, HMRC connection | P1 |
| **Loading/empty/error states** | Skeleton loaders, helpful empty states, error recovery with retry | P1 |

### Phase 2 — Growth (Months 5-8)

| Feature | Description |
|---------|-------------|
| **Mileage tracking** | Auto-log business journeys, 45p/mile HMRC rate |
| **Auto-pot savings** | Auto-transfer tax to savings pot (Monzo/Starling API) |
| **Year-end Self Assessment** | Complete SA100 filing direct to HMRC |
| **Cash flow forecasting** | "You'll run short in March if..." predictions |
| **Business health score** | Growth trends, quarter-on-quarter comparison |
| **VAT threshold alerts** | Warn when approaching £90k turnover |

---

## 4. Technology Architecture

### Tech Stack

**One codebase -> Web + iOS + Android** using Expo with React Native Web.

| Layer | Technology | Why | Monthly Cost |
|-------|-----------|-----|-------------|
| **Frontend (ALL platforms)** | Expo (SDK 54) + React Native Web | Single codebase builds iOS, Android AND web. One developer maintains everything. | £0 |
| **Backend API** | Cloudflare Workers + Hono | Serverless — zero servers to maintain. Auto-scales. 100k requests/day free. | £0 (free tier) |
| **Database** | Cloudflare D1 (SQLite) | 5GB free tier. Globally replicated reads. Zero config backups. | £0 → £5/mo |
| **Auth** | Clerk (@clerk/clerk-expo) | Magic link + Google login. 10k MAU free. JWT verification via middleware. | £0 |
| **Open Banking** | TrueLayer API | UK-focused, FCA regulated, handles all compliance. | ~£0.10/user/mo |
| **AI Categorisation** | Claude API (Haiku 4.5) | Cheapest model, fast, accurate for categorisation. Data anonymised before sending. | ~£0.001/request |
| **Payments** | Stripe (raw fetch, no SDK) | Subscriptions, UK cards, SCA-compliant. Workers-compatible via fetch API. | 1.4% + 20p |
| **Push Notifications** | Expo Notifications | Free, cross-platform, built into Expo. | £0 |
| **Hosting (Web)** | Cloudflare Pages | Expo web export as static site. Zero config. Global CDN. | £0 |
| **CDN + DNS** | Cloudflare | Free tier. DDoS protection, SSL, caching. | £0 |
| **CI/CD** | EAS Build + GitHub Actions | Expo Application Services for iOS/Android builds. | £0 (free tier) |
| **Monitoring** | Sentry (free) | Error tracking across all platforms. 5k events/mo free. | £0 |

**Total monthly cost at 0-2,000 users: ~£0-20/mo** (just API usage)

### Key API Integrations

| API | Purpose | Cost |
|-----|---------|------|
| **TrueLayer** | Open Banking — read bank transactions | £0.10/connection/mo |
| **HMRC MTD API** | Submit quarterly updates, SA100 | Free (gov API) |
| **Claude API (Haiku)** | Transaction categorisation (anonymised) | ~£0.001/request |
| **Stripe** | Payment processing (checkout + portal) | 1.4% + 20p per transaction |

---

## 5. Business Model

**No free tier. 14-day free trial. One plan. Everything included.**

| Plan | Price (exc. VAT) | What's Included |
|------|-----------------|-----------------|
| **Monthly** | £9.99/mo | Everything: AI categorisation, MTD submissions, unlimited banks, invoicing, expenses, tax calculator, reminders, plain English insights |
| **Annual** | £89.99/yr (£7.50/mo) | Same — 25% saving for annual commitment |

No tiers. No feature gates. No upsells. Sole traders hate complexity.

---

## 6. Competitive Analysis

| Competitor | Price | Weakness | QuidSafe Advantage |
|-----------|-------|----------|-------------------|
| **FreeAgent** | £19-34/mo | Too complex, too expensive for gig workers | 5x cheaper, simpler |
| **QuickBooks SE** | £10-25/mo | Over-featured, American-first | UK-native, MTD-focused |
| **Coconut** | £9/mo | No AI categorisation, manual tagging | Fully automated |
| **Ember** | £39/mo | Aimed at Ltd companies, expensive | Sole trader specialist |
| **HMRC app** | Free | Basic, confusing, no insights | Plain English, proactive |

---

## 7. Project Structure

```
quidsafe/
├── README.md
├── app.json                              # Expo config (SDK 54)
├── eas.json                              # EAS Build profiles
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config (Expo)
├── tsconfig.worker.json                  # TypeScript config (Workers)
├── wrangler.toml                         # Cloudflare Workers + D1 config
├── eslint.config.mjs                     # ESLint flat config
├── mockup.html                           # Interactive HTML design mockup
│
├── app/                                  # Expo Router (file-based routing)
│   ├── _layout.tsx                       # Root layout + AuthRedirect
│   ├── +not-found.tsx                    # 404 screen
│   ├── (auth)/
│   │   ├── _layout.tsx                   # Auth stack layout
│   │   ├── login.tsx                     # Login screen
│   │   └── signup.tsx                    # Signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx                   # Tab bar layout
│   │   ├── index.tsx                     # Dashboard (hero card, set-aside, actions)
│   │   ├── income.tsx                    # Income breakdown (chart, sources)
│   │   ├── expenses.tsx                  # Expenses (metrics, scan, claimed list)
│   │   ├── learn.tsx                     # Tax education articles
│   │   └── settings.tsx                  # Settings (security, appearance, account)
│   ├── billing/
│   │   └── index.tsx                     # Stripe subscription paywall
│   └── onboarding/
│       └── index.tsx                     # 3-step onboarding flow
│
├── components/ui/                        # Shared UI components
│   ├── ActionCard.tsx                    # Action card with icon + chevron
│   ├── Badge.tsx                         # Colored pill badges
│   ├── Button.tsx                        # Primary/secondary buttons
│   ├── Card.tsx                          # Base card component
│   ├── QuarterTimeline.tsx               # Q1-Q4 progress tracker
│   └── Skeleton.tsx                      # Loading skeleton components
│
├── constants/
│   ├── Colors.ts                         # Design system (navy, blue, gold, green)
│   └── Typography.ts                     # Font scales + weights
│
├── lib/
│   ├── api.ts                            # API client (typed methods)
│   ├── auth.ts                           # Clerk config + SecureStore token cache
│   ├── db.ts                             # D1 database helpers
│   ├── tax-engine.ts                     # UK tax calculations (IT, NI Class 2 & 4)
│   ├── types.ts                          # Shared TypeScript types
│   └── hooks/
│       └── useApi.ts                     # React Query hooks for all API endpoints
│
├── worker/                               # Cloudflare Worker API (Hono)
│   ├── index.ts                          # API routes (dashboard, transactions, tax, billing, banking, MTD)
│   ├── middleware/
│   │   └── auth.ts                       # Clerk JWT verification middleware
│   ├── migrations/
│   │   ├── 001_initial.sql               # Core tables (users, transactions, expenses)
│   │   └── 002_full_schema.sql           # Full schema (invoices, bank_connections, mtd)
│   ├── services/
│   │   ├── anonymiser.ts                 # PII removal before AI processing
│   │   ├── banking.ts                    # TrueLayer Open Banking integration
│   │   ├── categoriser.ts                # Claude AI transaction categorisation
│   │   └── stripe.ts                     # Stripe checkout, portal, webhooks (raw fetch)
│   └── utils/
│       └── crypto.ts                     # AES-256-GCM encryption utilities
│
├── types/
│   └── cloudflare.d.ts                   # D1 type declarations for frontend
│
├── .github/workflows/
│   ├── ci.yml                            # Lint + typecheck on PRs
│   ├── deploy.yml                        # Deploy Worker + Pages + D1 on merge to main
│   └── mobile-release.yml                # Manual EAS Build trigger
│
├── docs/                                 # Documentation
│   ├── BUSINESS_PLAN.md
│   ├── TECHNICAL_SPEC.md
│   ├── SECURITY.md
│   ├── PRIVACY_POLICY.md
│   ├── TERMS_OF_SERVICE.md
│   ├── TAX_RULES.md
│   ├── HOW_TO_USE.md
│   ├── REGULATORY.md
│   ├── GO_TO_MARKET.md
│   └── ACCESSIBILITY.md
│
├── prompts/                              # Claude Code build prompts
│   ├── 01-PROJECT_SETUP.md
│   ├── 02-DATABASE_SCHEMA.md
│   ├── 03-AUTH_AND_ONBOARDING.md
│   ├── 04-OPEN_BANKING.md
│   ├── 05-AI_CATEGORISATION.md
│   ├── 06-TAX_CALCULATOR.md
│   └── 07-11-REMAINING_PROMPTS.md
│
├── diagrams/                             # Architecture diagrams (Mermaid)
│   ├── dev-environment.md
│   ├── cloud-architecture.md
│   └── data-flow.md
│
└── logo/
    ├── LOGO_BRIEF.md
    └── quidsafe-icon.svg
```

---

## 8. Getting Started

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
git clone https://github.com/nate-dawg-519/QuidSafe.git
cd QuidSafe

# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.example .env.local
```

### Environment Variables

```bash
# .env.local
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...    # From Clerk dashboard
EXPO_PUBLIC_API_URL=http://localhost:8787         # Local worker URL
```

### Run Locally

```bash
# Terminal 1 — Start the Worker API (http://localhost:8787)
npx wrangler dev

# Terminal 2 — Start the app
npx expo start
# Press 'w' for web browser
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

### Database Setup

```bash
# Create D1 databases (first time only)
npx wrangler d1 create quidsafe-staging
npx wrangler d1 create quidsafe-production

# Run migrations locally
npx wrangler d1 migrations apply quidsafe-staging --local

# Run migrations on remote
npx wrangler d1 migrations apply quidsafe-staging --remote
npx wrangler d1 migrations apply quidsafe-production --remote --env production
```

### Deploy

Deployments happen automatically via GitHub Actions on merge to `main`:

1. **CI** (`ci.yml`) — Runs lint + typecheck on every PR
2. **Deploy** (`deploy.yml`) — Deploys Worker, Pages, and D1 migrations on merge to main
3. **Mobile** (`mobile-release.yml`) — Manual trigger for EAS Build (iOS + Android)

### Live URLs

- **API:** `https://quidsafe-api.nathanlufc.workers.dev`
- **Web:** `https://quidsafe.pages.dev`

---

## 9. Design System

The UI follows a glassmorphic design language defined in `mockup.html`:

| Token | Value | Usage |
|-------|-------|-------|
| Trust Navy | `#0F172A` | Primary backgrounds, text |
| Royal Blue | `#1E3A8A` | Secondary, active states, hero gradient |
| Warm Gold | `#CA8A04` | Accent, CTAs, set-aside card border |
| Success Green | `#16A34A` | Positive values, active badges |
| Error Red | `#DC2626` | Errors, destructive actions |
| Glass | `rgba(255,255,255,0.07)` | Glassmorphic card backgrounds |
| Hero gradient | `#0F172A → #1E3A8A` | Dashboard hero card |
| Border radius | Card: 16, Input: 12, Pill: 9999, Hero: 24 | Consistent rounding |

---

## 10. Security

- **AES-256-GCM encryption** for sensitive data at rest
- **AI anonymisation** — PII stripped before sending transactions to Claude API
- **Clerk JWT verification** on every API request
- **Read-only Open Banking** — can never move money
- **UK-hosted Cloudflare infrastructure**
- **GDPR-compliant** with right to delete, data export

See `docs/SECURITY.md` for full security architecture.

---

## License

MIT — Build freely, help sole traders.
