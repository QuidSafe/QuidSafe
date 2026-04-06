# CLAUDE.md

This file provides guidance to Claude Code when working with the QuidSafe codebase.

## Project Overview

**QuidSafe** is a UK sole trader tax tracking app — iOS + Android + Web from one Expo codebase. It connects to bank accounts via Open Banking, auto-categorises transactions with AI, and tells users exactly how much to set aside for tax.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 54 + React Native Web + Expo Router |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Auth | Clerk (@clerk/clerk-expo) |
| Payments | Stripe (raw fetch, no SDK) |
| Banking | TrueLayer (Open Banking) |
| AI | Claude API (Haiku) via anonymiser |
| Hosting | Cloudflare Pages (web) + EAS Build (mobile) |

## Commands

```bash
# Development
npx expo start                    # Start app (press w/i/a for web/iOS/Android)
npx wrangler dev                  # Start Worker API on localhost:8787

# Checks
npx tsc --noEmit                  # TypeScript check (app)
npx tsc --noEmit -p tsconfig.worker.json  # TypeScript check (worker)
npx eslint "app/**/*.tsx" "lib/**/*.ts" "components/**/*.tsx"  # Lint

# Build
npx expo export --platform web    # Web build to dist/

# Database
npx wrangler d1 migrations apply quidsafe-staging --local   # Local migrations
npx wrangler d1 migrations apply quidsafe-staging --remote  # Remote migrations

# Deploy
npx wrangler deploy               # Deploy Worker
npx wrangler pages deploy dist/   # Deploy Pages
```

## Architecture

### File Structure
```
app/                    # Expo Router screens
  (auth)/               # Login, signup
  (tabs)/               # Dashboard, income, expenses, learn, settings
  onboarding/           # 3-step onboarding
  billing/              # Stripe paywall
components/ui/          # Shared components (Card, Button, Badge, etc.)
constants/              # Colors.ts, Typography.ts (design system)
lib/                    # API client, auth, tax engine, hooks, types
worker/                 # Cloudflare Worker API
  index.ts              # All Hono routes
  middleware/auth.ts    # Clerk JWT verification
  services/             # stripe, banking, categoriser, anonymiser
  migrations/           # D1 SQL migrations
  utils/crypto.ts       # AES-256-GCM encryption
```

### Key Patterns
- **Auth**: Clerk JWT verified in `worker/middleware/auth.ts` on every API request
- **Database**: D1 prepared statements with `.bind()` — never concatenate SQL
- **Encryption**: Bank tokens encrypted via AES-256-GCM (`worker/utils/crypto.ts`)
- **AI safety**: PII stripped by `worker/services/anonymiser.ts` before Claude API calls
- **Stripe**: Uses raw `fetch()` — no Stripe SDK (Workers compatibility)
- **Types**: Two tsconfigs — `tsconfig.json` (Expo) and `tsconfig.worker.json` (Worker)
- **Fonts**: Manrope (body) + PlayfairDisplay (headings) loaded in `app/_layout.tsx`

### Design System
| Token | Value | Usage |
|-------|-------|-------|
| Trust Navy | `#0F172A` | Primary bg, text |
| Royal Blue | `#1E3A8A` | Secondary, hero gradient |
| Warm Gold | `#CA8A04` | Accent, CTAs, set-aside |
| Success Green | `#16A34A` | Positive values |
| Error Red | `#DC2626` | Errors |
| Glass | `rgba(255,255,255,0.07)` | Glassmorphic cards |

## Rules

1. **Security first** — This is a financial app. Never log PII, always parameterise queries, always verify auth.
2. **No Supabase** — We migrated to Cloudflare Workers + D1. Don't reference Supabase.
3. **No Stripe SDK** — Use raw fetch in Workers. The SDK doesn't work in Workers runtime.
4. **SQLite types** — D1 has no ENUM, BOOLEAN, UUID, or JSONB. Use TEXT + CHECK, INTEGER, TEXT, TEXT.
5. **Two tsconfigs** — Don't import Worker types into frontend code or vice versa.
6. **Design system** — Follow `mockup.html` and `constants/Colors.ts` for all UI work.
7. **Fonts** — Use `Manrope_*` for body and `PlayfairDisplay_*` for headings. Never use system fonts.
8. **Platform checks** — Use `Platform.OS` for native-only features (e.g., SecureStore).

## Agents

Use these agents for specialised tasks:

| Agent | When to Use |
|-------|------------|
| `typescript-reviewer` | Review TypeScript code changes |
| `security-reviewer` | After writing auth, API, payment, or encryption code |
| `build-error-resolver` | Fix TypeScript/ESLint/build errors |
| `performance-optimizer` | Optimise React renders, D1 queries, bundle size |
| `planner` | Plan new features or architectural changes |
| `tdd-guide` | Write tests or set up test infrastructure |
| `database-reviewer` | Review D1 schemas, migrations, or queries |

## Live URLs
- **API**: https://quidsafe-api.nathanlufc.workers.dev
- **Web**: https://quidsafe.pages.dev
