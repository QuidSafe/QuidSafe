# QuidSafe Production Setup

Everything you need to click/type/configure to make QuidSafe production-ready. Go in order - each step builds on the previous.

---

## Section 1: GitHub Environment Gates (5 min)

Prevents accidental production deploys.

1. Open **Settings → Environments** in the QuidSafe GitHub repo
2. Click **New environment** three times:

### Environment: `production`
- Required reviewers: yourself
- Deployment branches: `main` only

### Environment: `production-migrations`
- Required reviewers: yourself
- Deployment branches: `main` only
- Separate from `production` so migrations need a second approval click

### Environment: `staging`
- No approvals, no branch restrictions

---

## Section 2: Cloudflare Pages Staging (10 min)

Creates `staging.quidsafe.uk` so you can test frontend changes before prod.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Direct upload**
2. Project name: `quidsafe-staging`
3. Leave empty (CI uploads on each PR)
4. After creation: **Custom domains → Add `staging.quidsafe.uk`**
5. Cloudflare dashboard → your domain → **DNS**:
   - Add CNAME: `staging` → `quidsafe-staging.pages.dev` (proxied, orange cloud)

---

## Section 3: Clerk Staging Instance (10 min)

Separate Clerk instance so test users don't pollute production.

1. https://dashboard.clerk.com → **+ Create application**
2. Name: `quidsafe-staging`
3. Enable: Email + Password, Google OAuth (same as prod)
4. **Domains → Add `staging.quidsafe.uk`**
5. Configure DNS CNAME records Clerk provides (same process as production setup you did earlier)
6. **API Keys → copy the `pk_live_...`** (production keys work on any domain you've verified)

---

## Section 4: Stripe Price IDs (5 min)

Replace inline `price_data` with pre-created Price objects. Auditable in Stripe dashboard.

1. https://dashboard.stripe.com → **Live mode** toggle (top-right)
2. **Products → + Add product**
3. Name: `QuidSafe Pro`
4. Add two recurring prices:
   - `£7.99 GBP` monthly
   - `£79.99 GBP` yearly
5. Save → copy both `price_1...` IDs

Then:
```bash
npx wrangler secret put STRIPE_PRICE_MONTHLY --config wrangler.worker.toml --env production
# paste monthly price_... ID

npx wrangler secret put STRIPE_PRICE_ANNUAL --config wrangler.worker.toml --env production
# paste annual price_... ID
```

Repeat for staging if you want paid testing:
```bash
npx wrangler secret put STRIPE_PRICE_MONTHLY --config wrangler.worker.toml --env staging
npx wrangler secret put STRIPE_PRICE_ANNUAL --config wrangler.worker.toml --env staging
```

---

## Section 5: Health Check Token (2 min)

For protected `/health/detailed` endpoint and uptime monitoring.

```bash
# Generate a secure token
TOKEN=$(openssl rand -hex 32)
echo "Save this token: $TOKEN"

# Set it for production
npx wrangler secret put HEALTH_CHECK_TOKEN --config wrangler.worker.toml --env production
# paste $TOKEN

# And staging
npx wrangler secret put HEALTH_CHECK_TOKEN --config wrangler.worker.toml --env staging
# paste $TOKEN
```

Test it works:
```bash
curl -H "Authorization: Bearer $TOKEN" https://api.quidsafe.uk/health/detailed
# Should return: {"status":"ok","checks":{"database":{...},"clerk":{...}}}
```

---

## Section 6: GitHub Repository Secrets (3 min)

Settings → Secrets and variables → Actions → New repository secret:

| Name | Value | Where it's used |
|------|-------|-----------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING` | Staging Clerk `pk_live_...` | Staging web build |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY_STAGING` | Stripe test mode `pk_test_...` | Staging web build |

Production secrets already set: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

---

## Section 7: Sentry (Optional, 10 min)

Error reporting. Skip for launch, add when you have users.

1. https://sentry.io → sign up (free tier: 5k errors/month)
2. Create project → **React Native** → name `quidsafe`
3. Copy DSN (looks like `https://abc...@o123.ingest.sentry.io/456`)
4. Add GitHub secret: `EXPO_PUBLIC_SENTRY_DSN` = the DSN
5. Ask me to wire it up (requires `@sentry/react-native` install + native config)

---

## Section 8: Uptime Monitoring (5 min)

Automated alerts when the API is down.

### Option A: UptimeRobot (free, 5 min checks)
1. https://uptimerobot.com → sign up
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://api.quidsafe.uk/health`
   - Interval: 5 min
3. Add alert contact: your email / SMS / Slack

### Option B: Better Stack (free tier, 3 min checks)
Same steps, more features, better UI.

---

## Section 9: Verify Everything (10 min)

Once all above is done, run through this checklist:

```bash
# 1. Health check responds
curl https://api.quidsafe.uk/health

# 2. Detailed health check (with your token)
curl -H "Authorization: Bearer $TOKEN" https://api.quidsafe.uk/health/detailed

# 3. Staging URL loads (after first PR auto-deploys it)
open https://staging.quidsafe.uk

# 4. Rollback workflow is ready
gh workflow list | grep -i rollback

# 5. Production deploy requires approval
gh workflow list | grep -i "Deploy Production"
```

### Test the approval gate:
```bash
gh workflow run deploy.yml -f deploy_worker=false -f deploy_web=false -f apply_migrations=false
# Should create a workflow run waiting for your approval in GitHub UI
```

---

## Rolling forward

Once setup is complete, your daily flow is:

1. **Develop locally**: `npx expo start` + `npx wrangler dev --config wrangler.worker.toml`
2. **Open PR**: Auto-deploys to `staging.quidsafe.uk`, URL commented on PR
3. **Test on staging**: Real Clerk, real Stripe (test mode), real TrueLayer (sandbox)
4. **Merge PR**: Nothing happens (safe!)
5. **Deploy to production**: `gh workflow run deploy.yml` → approve in GitHub UI
6. **If broken**: `gh workflow run rollback.yml -f reason="..."` → approve

---

## What still needs manual work after all above

None! You're production-ready.

Future work (when you grow):
- Feature flags (GrowthBook/PostHog integration)
- A/B testing framework
- CDN for static assets (already on Cloudflare, fine for now)
- Separate compliance/auditing database for GDPR requests
