# CLAUDE.md

This file provides guidance to Claude Code when working with the QuidSafe codebase.

## Project Overview

**QuidSafe** is a UK sole trader tax tracking app - iOS + Android + Web from one Expo codebase. It connects to bank accounts via Open Banking (via TrueLayer, which is FCA-regulated as an AISP), auto-categorises transactions with AI, and tells users exactly how much to set aside for tax.

**Important**: QuidSafe is NOT FCA regulated and does not need to be - it is a tax tracking tool, not a financial adviser or investment platform. It provides tax estimates, not financial advice. Open Banking connectivity is provided by TrueLayer Ltd (FCA authorised). Never claim QuidSafe itself is FCA regulated.

**Pricing**: £7.99/month or £79.99/year (save 17%). Prices are shown inclusive of VAT. VAT-registered sole traders can reclaim VAT on their QuidSafe subscription as a business expense.

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
npx wrangler dev --config wrangler.worker.toml  # Start Worker API on localhost:8787

# Checks
npx tsc --noEmit                  # TypeScript check (app)
npx tsc --noEmit -p tsconfig.worker.json  # TypeScript check (worker)
npx eslint "app/**/*.tsx" "lib/**/*.ts" "components/**/*.tsx"  # Lint

# Build
npx expo export --platform web    # Web build to dist/

# Database
npx wrangler d1 migrations apply quidsafe-staging --local --config wrangler.worker.toml
npx wrangler d1 migrations apply quidsafe-staging --remote --config wrangler.worker.toml

# Deploy
npx wrangler deploy --config wrangler.worker.toml  # Deploy Worker
# Pages deploys automatically via Git push (configured in wrangler.toml)
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
- **Database**: D1 prepared statements with `.bind()` - never concatenate SQL
- **Encryption**: Bank tokens encrypted via AES-256-GCM (`worker/utils/crypto.ts`)
- **AI safety**: PII stripped by `worker/services/anonymiser.ts` before Claude API calls
- **Stripe**: Uses raw `fetch()` - no Stripe SDK (Workers compatibility)
- **Types**: Two tsconfigs - `tsconfig.json` (Expo) and `tsconfig.worker.json` (Worker)
- **Fonts**: Lexend (headings, weight 600), Source Sans 3 (body, weight 400/600), JetBrains Mono (monetary amounts) loaded in `app/_layout.tsx`
- **Icons**: Lucide (`lucide-react-native`) only, 1.5px stroke - no FontAwesome
- **Theme**: Dark-only - no light mode. `ThemeContext` always returns dark

### Design System
| Token | Value | Usage |
|-------|-------|-------|
| Black | `#000000` | Primary bg |
| Charcoal | `#0A0A0A` | Card bg, surfaces |
| Dark Grey | `#1A1A1A` | Elevated surfaces |
| Mid Grey | `#2A2A2A` | Borders, dividers |
| Electric Blue | `#0066FF` | Accent, CTAs, links |
| Blue Hover | `#0052CC` | Hover/press states |
| Blue Glow | `rgba(0,102,255,0.15)` | Tinted backgrounds |
| White | `#FFFFFF` | Primary text |
| Light Grey | `#A0A0A0` | Secondary text |
| Muted | `#666666` | Tertiary text |
| Success | `#00C853` | Positive values |
| Warning | `#FF9500` | Warnings |
| Error | `#FF3B30` | Errors |

Cards: bg `#0A0A0A`, border `1px solid #2A2A2A`, border-radius `12px`. Buttons/inputs: border-radius `8px`. No gradients - flat and clean.

## Rules

1. **Security first** - This is a financial app. Never log PII, always parameterise queries, always verify auth.
2. **No Supabase** - We migrated to Cloudflare Workers + D1. Don't reference Supabase.
3. **No Stripe SDK** - Use raw fetch in Workers. The SDK doesn't work in Workers runtime.
4. **SQLite types** - D1 has no ENUM, BOOLEAN, UUID, or JSONB. Use TEXT + CHECK, INTEGER, TEXT, TEXT.
5. **Two tsconfigs** - Don't import Worker types into frontend code or vice versa.
6. **Design system** - Follow `mockup.html` and `constants/Colors.ts` for all UI work.
7. **Fonts** - Use `Lexend_*` for headings, `SourceSans3_*` for body, `JetBrainsMono_*` for monetary amounts. Never use system fonts.
8. **Icons** - Use `lucide-react-native` only. No FontAwesome. Always use `strokeWidth={1.5}`.
9. **Dark only** - No light mode. No `isDark` conditionals. All colours come from the dark palette.
10. **Platform checks** - Use `Platform.OS` for native-only features (e.g., SecureStore).
11. **Responsive design** - Web layout must differ from mobile. Use `useWindowDimensions()` with breakpoints: 375px (mobile), 768px (tablet/desktop), 1024px (wide). Web gets wider content areas, hover states, and different navigation.
12. **Not FCA regulated** - QuidSafe is a tax tracking tool, not a financial adviser. TrueLayer (our Open Banking provider) is FCA regulated. Never claim QuidSafe itself is FCA regulated.
13. **Pricing** - £7.99/mo or £79.99/year (17% off). All prices include VAT. Note VAT-registered traders can reclaim.
14. **No `Link asChild` with Pressable** - On web, `Link asChild` breaks Pressable styles (background, flexDirection). Use `Pressable` with `onPress={() => router.push(href)}` instead. Plain `<Link>` for inline text links is fine.
15. **Web visual testing** - After any UI change, verify the web build renders correctly. Fonts, buttons, and layout must work on web, not just native. Run `npx expo export --platform web` and check `dist/` output.
16. **No em dashes** - Never use the em dash character. Use a hyphen (-) or a spaced hyphen ( - ) instead.

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
- **API**: https://api.quidsafe.uk
- **Web**: https://quidsafe.uk

## Pre-deploy gate
Always run /pre-deploy before npm run worker:deploy:production.
Changes to worker/middleware/auth.ts, worker/utils/crypto.ts, worker/services/stripe.ts, or worker/services/banking.ts → invoke worker-security-reviewer agent first.
Changes to lib/tax-engine.ts → invoke hmrc-tax-specialist agent and run /tax-audit.
New D1 migrations → invoke d1-reviewer agent and run /migrate.
