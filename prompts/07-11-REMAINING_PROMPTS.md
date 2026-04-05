# Prompt 07 — Dashboard UI (Mobile)

## Context
The dashboard is the hero screen. One glance tells the sole trader everything they need to know. Apply the QuidSafe design system (Soft UI Evolution, trust navy palette, Playfair Display headings, Manrope body, SVG icons only).

## Task
Build the main dashboard screen in `apps/mobile/src/screens/Dashboard.tsx`.

## Requirements

### Layout (top to bottom)
1. **Header** — "Good morning, Sarah" + avatar
2. **Hero Tax Card** — Navy gradient card showing: "SET ASIDE FOR TAX" label, large £2,847 amount, subtitle "Based on £14,235 income this tax year", split boxes for Income Tax and NI breakdown
3. **Plain English Insight** — Light blue banner: "You earned £3,240 this month. Set aside £648 and you're covered."
4. **Action Items** — Tappable cards with left colour border: deadline warnings (amber), on-track confirmation (green), MTD submission ready (blue)
5. **Quarter Timeline** — Visual Q1-Q4 progress with done/current/upcoming states
6. **Bottom Tab Bar** — Home, Income, Learn, Settings (glassmorphic backdrop blur)

### Data Fetching
- `GET /dashboard` API endpoint returns all dashboard data in a single call
- Use React Query for caching and background refetch
- Pull-to-refresh support
- Skeleton loading states (not spinners)

### Design Specs
- All interactive elements have `cursor-pointer` and press states (scale 0.98)
- Smooth transitions (250ms ease-out)
- WCAG AA contrast on all text
- Support for Dynamic Type / font scaling
- Safe area insets for notch devices

## Output
Dashboard screen component, API endpoint, React Query hooks, and skeleton loader.

---

# Prompt 08 — Push Notifications & Reminders

## Context
QuidSafe sends proactive reminders so sole traders never miss a deadline. This is a key retention feature.

## Task
Implement the notification system using Expo Notifications + a cron-based scheduler.

## Requirements

### Notification Types
1. **Deadline reminder (14 days before)** — "Your Q4 payment is due in 14 days (31 Jan). Estimated: £1,423."
2. **Deadline urgent (3 days before)** — "Q4 payment due in 3 days. Don't get hit with a late penalty."
3. **Weekly income summary (Monday 9am)** — "Last week you earned £812 from 3 sources. Tax to set aside: £162."
4. **Tax pot check (monthly)** — "You've set aside 92% of what you owe. Nice one."
5. **MTD submission ready** — "Your Q3 update is ready to submit to HMRC. Tap to review."
6. **Bank re-auth needed** — "Your Monzo connection expires in 7 days. Tap to reconnect."

### Implementation
- Register for push notifications on app launch (Expo Notifications)
- Store device push token in `user_devices` table
- Cron job checks daily: what notifications need sending today?
- Use Expo Push API to send notifications
- Track notification delivery status
- User can toggle each notification type in Settings

### UK Tax Deadlines (hardcoded)
- Q1 (Apr-Jun): Submit by 5 Aug
- Q2 (Jul-Sep): Submit by 5 Nov
- Q3 (Oct-Dec): Submit by 5 Feb
- Q4 (Jan-Mar): Submit by 5 May
- Self Assessment deadline: 31 Jan
- Payment on Account 1: 31 Jan
- Payment on Account 2: 31 Jul

## Output
Notification service, cron scheduler, push token registration, user preferences, and all notification templates.

---

# Prompt 09 — Stripe Payments & Subscriptions

## Context
QuidSafe has a single paid plan — no free tier, 14-day free trial only. Pricing: £9.99/mo or £89.99/yr. All features included: multi-bank, MTD submissions, AI categorisation, invoicing, expenses, reminders.

## Task
Implement Stripe subscriptions in the API and a paywall in the mobile app.

## Requirements

### API Endpoints
- `POST /billing/checkout` — Create Stripe Checkout session for Pro upgrade
- `POST /billing/portal` — Create Stripe Customer Portal link for managing subscription
- `POST /webhooks/stripe` — Handle Stripe webhook events
- `GET /billing/status` — Return current subscription status

### Webhook Events to Handle
- `checkout.session.completed` → Activate subscription
- `customer.subscription.created` → Start access
- `invoice.payment_succeeded` → Extend subscription
- `invoice.payment_failed` → Mark as past_due, send notification, give 7-day grace period
- `customer.subscription.deleted` → Revoke access, show re-subscribe screen

### Trial & Subscription Flow
- User signs up → 14-day free trial starts (no card required)
- Day 12 → Push notification: "Your trial ends in 2 days. Add payment to keep your data."
- Day 14 → Trial ends. Show subscription screen: £9.99/mo or £89.99/yr.
- If no payment → Read-only mode (can see dashboard but no sync, no submissions)
- On payment → Full access restored, all historical data preserved

### Subscription Screen (NOT a Paywall)
Don't show a feature comparison grid — there's only one plan. Instead show:
- "QuidSafe — £9.99/mo or £89.99/yr (save 25%)"
- "Everything included. No hidden extras."
- Social proof: "Join X,XXX sole traders"
- "Cancel anytime. No contracts."
- Monthly and Annual toggle
- "Subscribe" button → Stripe Checkout

### Security
- Stripe webhook signature verification (HMAC-SHA256) on every webhook
- Never store card details — Stripe handles all PII
- Subscription status cached locally, verified server-side on sensitive operations
```

## Output
Stripe integration, webhook handler, paywall screen, and feature gating logic.

---

# Prompt 10 — HMRC MTD Quarterly Submission

## Context
Making Tax Digital (MTD) requires sole traders to submit quarterly income updates to HMRC starting April 2026. QuidSafe automates this.

## Task
Implement HMRC MTD API integration for quarterly submissions.

## Requirements

### HMRC MTD API Integration
1. Register QuidSafe as MTD-compatible software with HMRC
2. OAuth flow to connect user's HMRC account (Government Gateway)
3. `POST /mtd/submit-quarterly` — Submit quarterly update containing:
   - Total business income for the quarter
   - Total allowable expenses for the quarter
   - Period start and end dates
4. `GET /mtd/obligations` — Check which quarters are due/submitted
5. `GET /mtd/submission/:id` — View submission status

### Submission Review Screen (Mobile)
Before submitting, show user a review screen:
- Quarter being submitted (e.g., Q3: Oct-Dec 2026)
- Total income: £4,200
- Total expenses: £380
- Net profit: £3,820
- "Submit to HMRC" button with confirmation dialog
- Success screen with HMRC receipt ID

### Error Handling
- HMRC API can be slow (10-30s) — show loading state
- Handle: invalid credentials, already submitted, period not open
- Store submission attempts and responses for audit trail

## Output
HMRC OAuth flow, MTD API service, submission endpoints, review screen, and error handling.

---

# Prompt 11 — Deployment & CI/CD

## Context
QuidSafe needs to be deployed to production with automated CI/CD, zero-downtime deploys, and monitoring.

## Task
Set up the complete deployment pipeline.

## Requirements

### Hosting Setup
- **API:** Deploy to Fly.io (London region `lhr`)
  - `fly.toml` config with health checks, auto-scaling (min 1, max 4)
  - 256MB RAM, shared-cpu-1x
  - Secrets via `fly secrets set`
- **Web (Next.js):** Deploy to Fly.io or Vercel
- **Database:** Supabase (eu-west-2 London)
- **Redis:** Upstash (eu-west-1)
- **CDN:** Cloudflare (free tier)

### GitHub Actions Workflows

**CI (on every PR):**
1. Install dependencies (Bun)
2. Lint + type-check
3. Run unit tests (Vitest)
4. Build all packages
5. Run database migrations against test DB

**CD (on merge to main):**
1. Run CI steps
2. Run database migrations (production)
3. Deploy API to Fly.io
4. Deploy Web to Fly.io/Vercel
5. Notify Sentry of new release
6. Post deploy health check

**Mobile Release (manual trigger):**
1. Bump version
2. Build iOS + Android via EAS Build
3. Submit to App Store Connect + Google Play Console
4. Create GitHub release tag

### Monitoring
- Sentry for error tracking (source maps uploaded on deploy)
- Axiom for structured logging
- Better Uptime for status page + uptime monitoring
- Fly.io metrics dashboard for CPU/memory/network

### Environment Management
- `.env.production` template with all required vars
- Separate Supabase projects for staging and production
- Feature flags via environment variables for gradual rollout

## Output
All deployment configs, GitHub Actions workflows, Fly.io config, and monitoring setup.
