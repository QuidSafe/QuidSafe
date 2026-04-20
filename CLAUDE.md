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
| Auth | Clerk (@clerk/clerk-expo) - production instance |
| Payments | Stripe (raw fetch, no SDK) |
| Banking | TrueLayer (Open Banking) |
| AI | Claude API (Haiku) via anonymiser |
| Email | Resend (raw fetch, no SDK) |
| Hosting | Cloudflare Pages (web) + Cloudflare Workers (API) + EAS Build (mobile) |

## Live URLs

- **Web**: https://quidsafe.uk
- **API**: https://api.quidsafe.uk
- **Clerk**: https://clerk.quidsafe.uk (frontend API)

## Commands

```bash
# Development
npx expo start                                         # Start app (w/i/a for web/iOS/Android)
npx wrangler dev --config wrangler.worker.toml        # Start Worker API on localhost:8787

# Checks
npx tsc --noEmit                                      # TypeScript check (Expo app)
npx tsc --noEmit -p tsconfig.worker.json              # TypeScript check (Worker)
npm run lint                                          # ESLint
npm test                                              # Run Jest tests

# Build
npx expo export --platform web                        # Web build to dist/

# Database
npx wrangler d1 migrations apply quidsafe-dev --local --config wrangler.worker.toml
npx wrangler d1 migrations apply quidsafe-staging --remote --config wrangler.worker.toml --env staging
npx wrangler d1 migrations apply quidsafe-production --remote --config wrangler.worker.toml --env production

# Deploy
npx wrangler deploy --config wrangler.worker.toml --env production    # Deploy Worker
npx wrangler pages deploy dist --project-name quidsafe                # Deploy web manually
# Note: CI auto-deploys on merge to main via .github/workflows/deploy.yml

# Secrets (production)
npx wrangler secret put CLERK_SECRET_KEY --config wrangler.worker.toml --env production
npx wrangler secret put RESEND_API_KEY --config wrangler.worker.toml --env production
```

## Project Structure

```
QuidSafe/
├── app/                                    # Expo Router screens (React Native Web)
│   ├── _layout.tsx                         # Root layout, Clerk provider, auth redirect
│   ├── landing.tsx                         # Public marketing page
│   ├── +not-found.tsx                      # 404 page
│   ├── (auth)/                             # Public auth routes
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                             # Main authenticated tabs
│   │   ├── _layout.tsx                     # Tab bar config
│   │   ├── index.tsx                       # Dashboard
│   │   ├── income.tsx                      # Income tracker
│   │   ├── expenses.tsx                    # Expense list
│   │   ├── learn.tsx                       # Learn articles
│   │   └── settings.tsx                    # User settings, notifications
│   ├── onboarding/index.tsx                # 3-step onboarding flow
│   ├── billing/index.tsx                   # Stripe paywall
│   ├── invoice/[id].tsx                    # Invoice detail, send-to-client
│   ├── expense/[id].tsx                    # Expense detail
│   ├── invoices.tsx                        # Invoice list
│   ├── transactions.tsx                    # Transaction list (modal)
│   ├── mtd.tsx                             # Making Tax Digital flow
│   ├── self-assessment.tsx                 # Self-assessment calculator
│   ├── tax-history.tsx                     # Historical tax years
│   ├── status.tsx                          # Connection/sync status
│   ├── about.tsx                           # About page
│   ├── privacy.tsx                         # Privacy policy
│   ├── terms.tsx                           # Terms of service
│   └── cookie-policy.tsx                   # Cookie policy
│
├── components/ui/                          # Shared UI components
│   ├── BrandLogo.tsx                       # QuidSafe shield logo
│   ├── Card.tsx                            # Base card container
│   ├── Button.tsx                          # Primary button
│   ├── Toast.tsx                           # Toast notification provider
│   ├── EmptyState.tsx                      # Empty list placeholder
│   ├── Skeleton.tsx                        # Loading skeleton
│   ├── ErrorBoundary.tsx                   # App-wide error boundary
│   ├── BiometricGate.tsx                   # Face ID/Touch ID gate
│   ├── CookieConsent.tsx                   # Web-only GDPR banner
│   ├── SidebarNav.tsx                      # Desktop sidebar nav
│   ├── SearchFilter.tsx                    # Search + date range filter
│   ├── DateInput.tsx                       # Cross-platform date picker
│   ├── DonutChart.tsx                      # SVG donut chart
│   ├── MiniChart.tsx                       # Inline sparkline
│   ├── QuarterTimeline.tsx                 # MTD quarter timeline
│   ├── ActionCard.tsx                      # Dashboard action card
│   ├── TaxHeroCard.tsx                     # Dashboard tax summary hero
│   ├── IncomeBySource.tsx                  # Income breakdown chart
│   ├── ExpenseMetrics.tsx                  # Expense summary
│   ├── ExpenseRow.tsx                      # Expense list row
│   ├── WelcomeState.tsx                    # First-run welcome card
│   ├── OnboardingIllustrations.tsx         # Onboarding SVGs
│   ├── AddExpenseModal.tsx                 # Create/edit expense modal
│   ├── AddRecurringExpenseModal.tsx        # Recurring expense modal
│   └── CreateInvoiceModal.tsx              # Create invoice modal
│
├── constants/                              # Design tokens
│   ├── Colors.ts                           # Colour palette (native dark, web light)
│   └── Typography.ts                       # Font families + sizes
│
├── lib/                                    # Shared frontend utilities
│   ├── api.ts                              # API client (ApiClient class)
│   ├── auth.ts                             # Clerk publishable key, tokenCache
│   ├── db.ts                               # D1 query helpers (shared with worker)
│   ├── tax-engine.ts                       # UK tax calculation (IT + NI + MTD)
│   ├── types.ts                            # Shared TypeScript types
│   ├── notifications.ts                    # Expo push token registration
│   ├── biometrics.ts                       # Expo Local Authentication wrapper
│   ├── haptics.ts                          # Haptic feedback helpers
│   ├── offlineCache.ts                     # AsyncStorage offline cache
│   ├── invoicePdf.ts                       # Invoice PDF generation
│   ├── invoiceActions.ts                   # Invoice download/share
│   ├── export.ts                           # CSV export
│   ├── ThemeContext.tsx                    # Theme provider (dark-only)
│   ├── useResponsiveLayout.ts              # Breakpoint hook
│   ├── hooks/
│   │   ├── useApi.ts                       # React Query hooks for API
│   │   └── useApiWithToast.ts              # Mutations with toast feedback
│   └── __tests__/
│       └── tax-engine.test.ts              # Tax engine unit tests
│
├── worker/                                 # Cloudflare Worker backend
│   ├── index.ts                            # Hono routes + scheduled handler
│   ├── validation.ts                       # Zod schemas for all API inputs
│   ├── middleware/
│   │   ├── auth.ts                         # Clerk JWT verification
│   │   └── rateLimit.ts                    # Per-user rate limiting
│   ├── services/
│   │   ├── banking.ts                      # TrueLayer OAuth + sync
│   │   ├── categoriser.ts                  # Claude AI categorisation
│   │   ├── anonymiser.ts                   # PII stripping for AI calls
│   │   ├── hmrc.ts                         # HMRC MTD submission
│   │   ├── stripe.ts                       # Stripe checkout/webhooks (raw fetch)
│   │   ├── emailService.ts                 # Resend email sender
│   │   └── notifications.ts                # Expo push notifications
│   ├── utils/
│   │   └── crypto.ts                       # AES-256-GCM token encryption
│   └── migrations/                         # D1 SQL migrations (numbered)
│       ├── 001_initial.sql
│       ├── 002_full_schema.sql
│       ├── 003_notification_preferences.sql
│       ├── 004_grace_period_and_tiers.sql
│       ├── 005_notify_mtd_ready.sql
│       ├── 006_recurring_expenses.sql
│       ├── 007_rate_limits.sql
│       ├── 008_remove_free_tier.sql
│       ├── 009_nino.sql
│       ├── 010_performance_indexes.sql
│       ├── 011_oauth_states.sql
│       ├── 012_articles.sql
│       ├── 013_additional_indexes.sql
│       ├── 014_fix_check_constraints.sql
│       └── seed.sql                        # Local test data
│
├── public/                                 # Static web assets
│   ├── manifest.json                       # PWA manifest
│   ├── robots.txt                          # Search crawler rules
│   └── sitemap.xml                         # SEO sitemap
│
├── .github/workflows/
│   ├── ci.yml                              # Lint, typecheck, staging deploy on PR
│   └── deploy.yml                          # Production deploy on merge to main
│
├── wrangler.worker.toml                    # Cloudflare Worker config (dev/staging/prod)
├── tsconfig.json                           # Expo app TypeScript config
├── tsconfig.worker.json                    # Worker TypeScript config
├── app.json                                # Expo config
├── eas.json                                # EAS Build config (mobile)
└── package.json
```

## Where to Edit (Common Tasks)

| Task | File(s) |
|------|---------|
| Add a new API route | [worker/index.ts](worker/index.ts) + [worker/validation.ts](worker/validation.ts) (Zod schema) |
| Add API client method | [lib/api.ts](lib/api.ts) + [lib/hooks/useApi.ts](lib/hooks/useApi.ts) (React Query hook) |
| Add a toast-wrapped mutation | [lib/hooks/useApiWithToast.ts](lib/hooks/useApiWithToast.ts) |
| Add a new screen | `app/<name>.tsx` + register in [app/_layout.tsx](app/_layout.tsx) Stack |
| Modify tax calculation | [lib/tax-engine.ts](lib/tax-engine.ts) + update [lib/__tests__/tax-engine.test.ts](lib/__tests__/tax-engine.test.ts) |
| Add a D1 table/column | New migration in `worker/migrations/NNN_*.sql` (next number: 015) |
| Add shared types | [lib/types.ts](lib/types.ts) |
| Add a new colour/token | [constants/Colors.ts](constants/Colors.ts) |
| Add a notification template | [worker/services/notifications.ts](worker/services/notifications.ts) |
| Add daily cron logic | [worker/index.ts](worker/index.ts) `scheduled` function |
| Add env var to Worker | [wrangler.worker.toml](wrangler.worker.toml) `[env.<name>.vars]` + `Env` interface in [worker/index.ts](worker/index.ts) |
| Add frontend env var | [.env.example](.env.example) + [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (prefixed `EXPO_PUBLIC_`) |

## Environment Variables

### Worker (Cloudflare secrets)
| Var | Type | Notes |
|-----|------|-------|
| `CLERK_SECRET_KEY` | Secret | `sk_live_...` from Clerk production instance |
| `CLERK_PUBLISHABLE_KEY` | Var | `pk_live_Y2xlcmsucXVpZHNhZmUudWsk` (in wrangler.worker.toml) |
| `STRIPE_SECRET_KEY` | Secret | `sk_live_...` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret | `whsec_...` for webhook verification |
| `TRUELAYER_CLIENT_ID` | Secret | TrueLayer OAuth |
| `TRUELAYER_CLIENT_SECRET` | Secret | TrueLayer OAuth |
| `HMRC_CLIENT_ID` | Secret | HMRC MTD API |
| `HMRC_CLIENT_SECRET` | Secret | HMRC MTD API |
| `ENCRYPTION_KEY` | Secret | 64-char hex for AES-256-GCM bank token encryption |
| `ANTHROPIC_API_KEY` | Secret | Claude Haiku for categorisation |
| `RESEND_API_KEY` | Secret | Invoice email delivery |
| `FROM_EMAIL` | Var | `invoices@quidsafe.uk` (in wrangler.worker.toml) |

### Frontend (GitHub Actions secrets, baked into Pages build)
| Var | Notes |
|-----|-------|
| `EXPO_PUBLIC_API_URL` | `https://api.quidsafe.uk` (set in deploy.yml) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsucXVpZHNhZmUudWsk` |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

## Staging Access Protection

The staging **web frontend** (`staging.quidsafe.uk`) is gated by **Cloudflare Access** (Zero Trust) — one-time-PIN email login before Pages serves anything. The staging **API** (`api-staging.quidsafe.uk`) is not behind Access; it uses Clerk JWT auth like production (putting Access in front of a cross-host API breaks browser fetches). Allowlist is managed in the Cloudflare dashboard (Zero Trust → Access → Applications → "QuidSafe Staging").

- **DO NOT** disable the Access application to "unblock" something - add the email to the allowlist instead.
- **DO NOT** put real customer data in the staging D1 database - use synthetic / reset at will.
- Full runbook: [docs/runbooks/staging-access.md](docs/runbooks/staging-access.md).

Web shows a yellow banner on non-prod builds via [components/ui/EnvBanner.tsx](components/ui/EnvBanner.tsx) - visual insurance against ever treating staging UI as real.

## Admin Surface

Owner-only read-only dashboard at [`/admin/setup`](app/admin/setup.tsx) showing env-var presence, D1 migration status, and external service wiring. Worker gates `/admin/*` via an `ADMIN_EMAILS` allowlist and returns **404** (not 403) to non-admins so the surface isn't enumerable.

**Add or remove an admin** (value is comma-separated, case-insensitive):
```bash
wrangler secret put ADMIN_EMAILS --config wrangler.worker.toml --env production
# Enter: owner@example.com,cofounder@example.com
```

**When the repo changes, update the knowledge base**:
- New Worker env var → add to [worker/admin/config.ts](worker/admin/config.ts) `REQUIRED_ENV_VARS`
- New D1 migration → add filename to `MIGRATION_FILES` (a drift test in [worker/admin/__tests__/config.test.ts](worker/admin/__tests__/config.test.ts) fails CI if you forget)
- New third-party service → add to `EXTERNAL_SERVICES` with the env keys that prove it's wired

**Security rules for this surface** - never weaken these:
- `secret`-kind env keys must have `previewable: false`. Last 4 chars of a Stripe/Clerk key helps an attacker confirm a leaked credential.
- Don't log the admin's email in [worker/middleware/adminAuth.ts](worker/middleware/adminAuth.ts) - Cloudflare Workers tail logs are visible to every account collaborator.
- Read-only only. No write actions on `/admin/*` routes until we add MFA gating + audit logging.

## Key Patterns

- **Auth**: Clerk JWT verified in [worker/middleware/auth.ts](worker/middleware/auth.ts) on every API request. Frontend calls `api.setToken()` in [lib/hooks/useApi.ts](lib/hooks/useApi.ts) `useApiToken()`.
- **Database**: D1 prepared statements with `.bind()` - never concatenate SQL. Use helpers in [lib/db.ts](lib/db.ts) (`query`, `queryOne`, `execute`).
- **Validation**: All Worker routes validate input with Zod schemas in [worker/validation.ts](worker/validation.ts) via `.safeParse()`.
- **Encryption**: Bank tokens encrypted via AES-256-GCM ([worker/utils/crypto.ts](worker/utils/crypto.ts)).
- **AI safety**: PII stripped by [worker/services/anonymiser.ts](worker/services/anonymiser.ts) before Claude API calls.
- **Stripe/Resend**: Use raw `fetch()` - no SDKs (Workers runtime incompatible).
- **Types**: Two tsconfigs - `tsconfig.json` (Expo) and `tsconfig.worker.json` (Worker). Don't cross-import.
- **React Query**: All data fetching via hooks in [lib/hooks/useApi.ts](lib/hooks/useApi.ts). Invalidate on mutation.
- **Error handling**: API errors return `{ error: { code, message } }` shape. Frontend uses `useApiWithToast` wrappers.
- **Platform checks**: Use `Platform.OS` for native-only features (SecureStore, haptics, biometrics).
- **Scheduled handler**: Daily cron at 6am UTC runs bank sync, notifications, invoice overdue check, grace period expiry, and recurring expense auto-log.

## Design System

### Colours (native: dark / web: light)

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

### Layout
- Cards: bg `#0A0A0A`, border `1px solid #2A2A2A`, border-radius `12px`
- Buttons/inputs: border-radius `8px`
- No gradients - flat and clean
- Spacing scale: `xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48`

### Typography
- **Headings**: `Lexend_600SemiBold`
- **Body**: `SourceSans3_400Regular` / `SourceSans3_600SemiBold`
- **Monetary amounts**: `JetBrainsMono_400Regular` / `JetBrainsMono_600SemiBold`
- Loaded in [app/_layout.tsx](app/_layout.tsx) via `@expo-google-fonts/*`

### Icons
- [lucide-react-native](https://lucide.dev) only
- Always `strokeWidth={1.5}`
- No FontAwesome

## Responsive Breakpoints

Use `useWindowDimensions()` with these breakpoints:
- **Mobile**: < 768px
- **Tablet/Desktop**: 768px - 1023px
- **Wide**: >= 1024px

Web layouts should differ from mobile - wider content areas, hover states, desktop navigation.

## Rules

1. **Security first** - This is a financial app. Never log PII, always parameterise queries, always verify auth.
2. **No Supabase** - We migrated to Cloudflare Workers + D1. Don't reference Supabase.
3. **No SDKs in Workers** - Stripe and Resend use raw `fetch()`. SDKs don't work in Workers runtime.
4. **SQLite types** - D1 has no ENUM, BOOLEAN, UUID, or JSONB. Use TEXT + CHECK, INTEGER, TEXT, TEXT.
5. **Two tsconfigs** - Don't import Worker types into frontend code or vice versa.
6. **Design system** - Follow [constants/Colors.ts](constants/Colors.ts) for all UI work.
7. **Fonts** - Use `Lexend_*` for headings, `SourceSans3_*` for body, `JetBrainsMono_*` for monetary amounts. Never use system fonts.
8. **Icons** - Use `lucide-react-native` only. No FontAwesome. Always `strokeWidth={1.5}`.
9. **Native dark, web light** - Native (iOS/Android) uses the dark palette. Web uses a light palette. Colour tokens in [constants/Colors.ts](constants/Colors.ts) branch on `Platform.OS === 'web'` at module scope, so most screens get the right palette automatically. Never add an `isDark` runtime conditional and never hardcode `#000000` / `#0A0A0A` as a background - use `Colors.charcoal` / `colors.surface` so it flips correctly on web.
10. **Platform checks** - Use `Platform.OS` for native-only features (e.g., SecureStore, biometrics).
11. **Responsive design** - Web layout must differ from mobile. See breakpoints above.
12. **Not FCA regulated** - QuidSafe is a tax tracking tool, not a financial adviser. TrueLayer (Open Banking) is FCA regulated. Never claim QuidSafe itself is.
13. **Pricing** - £7.99/mo or £79.99/year (17% off). All prices include VAT. Note VAT-registered traders can reclaim.
14. **No `Link asChild` with Pressable** - On web, `Link asChild` breaks Pressable styles. Use `Pressable` with `onPress={() => router.push(href)}` instead. Plain `<Link>` for inline text links is fine.
15. **Web visual testing** - After any UI change, verify the web build. Run `npx expo export --platform web` and check `dist/` output.
16. **No em dashes** - Never use the em dash character. Use a hyphen (-) or a spaced hyphen ( - ) instead.
17. **Migrations are append-only** - Never edit existing migrations. Always create a new numbered file.
18. **Zod validation** - All Worker routes must validate request bodies with Zod schemas from [worker/validation.ts](worker/validation.ts).
19. **Branch protection** - `main` requires CI passing. Push to feature branch and open a PR - no direct pushes.

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

## Pre-deploy Gate

Always run `/pre-deploy` before deploying to production.

- Changes to [worker/middleware/auth.ts](worker/middleware/auth.ts), [worker/utils/crypto.ts](worker/utils/crypto.ts), [worker/services/stripe.ts](worker/services/stripe.ts), or [worker/services/banking.ts](worker/services/banking.ts) → invoke `security-reviewer` agent first
- Changes to [lib/tax-engine.ts](lib/tax-engine.ts) → invoke `hmrc-tax-specialist` agent and run `/tax-audit`
- New D1 migrations → invoke `database-reviewer` agent and run `/migrate`

## Environments & Deployment

### The 3 environments

| Env | Web | API | DB | Clerk | Purpose |
|-----|-----|-----|-----|-------|---------|
| **Local** | `localhost:8081` (expo start) | `localhost:8787` (wrangler dev) | Local D1 | `pk_test_*` | Your laptop |
| **Staging** | `staging.quidsafe.uk` (Pages) | `api-staging.quidsafe.uk` (Worker) | `quidsafe-staging` | `pk_live_*` (separate) | Pre-prod verification |
| **Production** | `quidsafe.uk` (Pages) | `api.quidsafe.uk` (Worker) | `quidsafe-production` | `pk_live_*` (real users) | Live customers |

### The rollout flow

```
PR opened ─▶ Lint + tests + E2E (ci.yml, e2e.yml)
         ─▶ Auto-deploy to staging (deploy-staging.yml, deploy-staging-web.yml)
         ─▶ Test on staging URL (commented on PR)
         ─▶ Merge PR → auto-deploys to production (deploy.yml on push)
         ─▶ If it breaks: `npx wrangler rollback --env production`
```

### Workflows

| Workflow | Trigger | Does what |
|----------|---------|-----------|
| [ci.yml](.github/workflows/ci.yml) | PR | Lint, typecheck, tests, web build (conditional) |
| [e2e.yml](.github/workflows/e2e.yml) | PR (frontend changes) | Playwright against live |
| [deploy-staging.yml](.github/workflows/deploy-staging.yml) | PR (worker changes) | Deploy Worker to staging |
| [deploy-staging-web.yml](.github/workflows/deploy-staging-web.yml) | PR (frontend changes) | Deploy web to `staging.quidsafe.uk`, comment URL |
| [deploy.yml](.github/workflows/deploy.yml) | Push to main (auto) OR manual `workflow_dispatch` | Auto-deploys Worker + Web on merge. Migrations still require manual approval via `workflow_dispatch` with `apply_migrations=true`. |
| [deploy-dev.yml](.github/workflows/deploy-dev.yml) | **Manual** (`workflow_dispatch`) | Deploy a specific branch to the dev Worker |

### Required GitHub Environments (set up in repo Settings → Environments)

- **`production`** — Required reviewers: 1+ (you). Worker + web deploys require approval.
- **`production-migrations`** — Required reviewers: 1+. D1 migrations require SEPARATE approval (bad migration = dead prod).
- **`staging`** — Auto, no approval needed.

### Required GitHub Secrets

Already set (production):
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live_ for production Clerk)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_ for production Stripe)

Add for staging/observability:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING` (separate pk_live_ for staging Clerk instance)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY_STAGING` (Stripe test mode pk_test_)
- `EXPO_PUBLIC_SENTRY_DSN` (Sentry project DSN for frontend error reporting)
- `HEALTH_CHECK_TOKEN` (Worker secret: `wrangler secret put HEALTH_CHECK_TOKEN`)

### Deploying to production

```bash
# From GitHub Actions UI:
#   Actions > Deploy Production > Run workflow
#   Toggle: deploy_worker, deploy_web, apply_migrations
#   (apply_migrations defaults to false - second click required)
#
# Or from CLI:
gh workflow run deploy.yml \
  -f deploy_worker=true \
  -f deploy_web=true \
  -f apply_migrations=false
```

### Rolling back

Worker rollback (one command, ~30s):

```bash
npx wrangler rollback --config wrangler.worker.toml --env production --message "Payments broken after deploy"
```

Web rollback is manual via Cloudflare Pages dashboard (Pages → Deployments → select previous → Rollback).

### Health checks

- `GET /health` — public, minimal response (for uptime monitors)
- `GET /health/detailed` — requires `Authorization: Bearer $HEALTH_CHECK_TOKEN`, checks D1 + Clerk JWKS reachability, returns 503 if any fail

### Branch protection

- `main` requires "Lint & Typecheck" check to pass
- `main` requires at least 1 approval (if you add collaborators)
- Auto-merge via `gh pr merge --auto --squash --delete-branch` is the preferred workflow
