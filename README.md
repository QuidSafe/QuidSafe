# QuidSafe - Sole Trader Tax Tracker

> **"Set aside £648 this month. That's it."**

QuidSafe connects to your bank via Open Banking, auto-categorises transactions with AI, and tells you exactly how much to set aside for HMRC - updated in real time.

Built for UK sole traders. iOS + Android + Web from one Expo codebase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 54 + React Native Web + Expo Router |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Auth | Clerk |
| Payments | Stripe (raw fetch) |
| Banking | TrueLayer (Open Banking) |
| AI | Claude API (Haiku) |
| Hosting | Cloudflare Pages (web) + EAS Build (mobile) |

## Quick Start

```bash
# Install
npm install

# Start the app (press w for web, i for iOS, a for Android)
npx expo start

# Start the Worker API (localhost:8787)
npx wrangler dev --config wrangler.worker.toml

# Run DB migrations locally
npx wrangler d1 migrations apply DB --local --config wrangler.worker.toml
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Worker secrets (set via `wrangler secret put`):
- `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `ENCRYPTION_KEY` (run `openssl rand -hex 32`)
- `TRUELAYER_CLIENT_ID` + `TRUELAYER_CLIENT_SECRET` + `TRUELAYER_REDIRECT_URI`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`

## Project Structure

```
app/                    # Expo Router screens
  (auth)/               # Login, signup
  (tabs)/               # Dashboard, income, expenses, learn, settings
  onboarding/           # 3-step onboarding
  billing/              # Stripe paywall
components/ui/          # Shared components
constants/              # Colors.ts, Typography.ts
lib/                    # API client, auth, tax engine, hooks, types
worker/                 # Cloudflare Worker API
  services/             # stripe, banking, categoriser, anonymiser, hmrc
  middleware/            # auth (Clerk JWT), rateLimit
  migrations/           # D1 SQL migrations (001-012)
  utils/crypto.ts       # AES-256-GCM encryption
```

## Commands

```bash
npx tsc --noEmit                    # TypeScript check (app)
npx tsc --noEmit -p tsconfig.worker.json  # TypeScript check (worker)
npx expo export --platform web      # Web build
npx wrangler deploy --config wrangler.worker.toml  # Deploy Worker
```

## Deploy

```bash
# 1. Apply migrations
npx wrangler d1 migrations apply DB --remote --config wrangler.worker.toml

# 2. Deploy worker
npx wrangler deploy --config wrangler.worker.toml

# 3. Deploy web (Pages auto-deploys from main, or manually)
npx wrangler pages deploy dist --project-name=quidsafe
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Trust Navy | `#0F172A` | Primary bg, text |
| Royal Blue | `#1E3A8A` | Secondary, gradients |
| Warm Gold | `#CA8A04` | Accent, CTAs |
| Success Green | `#16A34A` | Positive values |
| Fonts | Manrope (body) + Playfair Display (headings) | |

## Live URLs

- **API:** https://quidsafe-api.nathanlufc.workers.dev
- **Web:** https://quidsafe.pages.dev

## License

MIT
