# QuidSafe Launch Checklist

User-action items required before or shortly after production launch. These cannot be automated - they need you to sign up for services, provide API keys, or configure third parties.

## Critical (blocks features)

### 1. Resend API key (blocks invoice emails)
Invoice email delivery via `worker/services/emailService.ts` is wired up but needs:

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day, 3k/month)
2. Go to **API Keys** > **Create API Key** > copy the `re_...` key
3. Set as Worker secret:
   ```bash
   cd ~/Documents/GitHub/QuidSafe
   npx wrangler secret put RESEND_API_KEY --config wrangler.worker.toml --env production
   ```
4. Go to **Domains** > **Add Domain** > `quidsafe.uk`
5. Add the DNS records Resend gives you to Cloudflare DNS (SPF, DKIM, DMARC)
6. Wait for domain verification (~5 min)
7. Test by sending an invoice via the UI

### 2. Google OAuth credentials (blocks Google sign-in)
Currently throws "Missing required parameter: client_id" on production.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project "QuidSafe"
3. **APIs & Services** > **OAuth consent screen** > External > fill in app name, support email, developer email
4. **Credentials** > **Create Credentials** > **OAuth client ID** > Web application
5. Name: `QuidSafe Web`
6. **Authorized JavaScript origins**: `https://clerk.quidsafe.uk`
7. **Authorized redirect URIs**: `https://clerk.quidsafe.uk/v1/oauth_callback`
8. Copy Client ID and Client Secret
9. In Clerk Dashboard > **SSO Connections** > **Google** > **Use custom credentials** > paste both
10. Save

### 3. Plausible Analytics (already wired in code)
The `<script>` tag is in `app/_layout.tsx`. Just need the account:

1. Sign up at [plausible.io](https://plausible.io) (£9/month - GDPR-friendly, no cookies)
2. Add site `quidsafe.uk`
3. Done - data will start flowing immediately

Alternative: self-host Plausible Community Edition for free (requires a VPS).

## Important (before scale)

### 4. Stripe live mode
Currently using test keys (`sk_test_...`). Before taking real payments:

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Create live products matching the test ones (£7.99/mo, £79.99/year)
3. Copy new `sk_live_...` and `pk_live_...` keys
4. Update:
   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY --config wrangler.worker.toml --env production
   npx wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.worker.toml --env production
   ```
5. Update GitHub secret `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` with the new `pk_live_...`
6. Configure webhook endpoint in Stripe Dashboard pointing to `https://api.quidsafe.uk/api/billing/webhook`
7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### 5. Sentry error monitoring (recommended)
Not yet wired. When ready:

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5k errors/month)
2. Create two projects: `quidsafe-web` (React Native) and `quidsafe-worker` (Cloudflare Workers)
3. Install:
   ```bash
   npx expo install sentry-expo
   npm install @sentry/cloudflare
   ```
4. Frontend: add `Sentry.init({ dsn: ... })` in `app/_layout.tsx`
5. Worker: wrap exports with `withSentry` in `worker/index.ts`
6. Add DSN as GitHub secret `EXPO_PUBLIC_SENTRY_DSN` and Worker secret `SENTRY_DSN`

### 6. Proper OG image (1200×630)
Currently using the 1024×1024 app icon as the OG image. For best social previews:

1. Design a 1200×630 image in Figma/Canva with:
   - QuidSafe shield logo
   - "Tax, sorted." headline
   - "Tax tracking for UK sole traders" tagline
   - Electric blue accent on black
2. Save as `public/assets/images/og-image.png`
3. Update `app/_layout.tsx` line 160:
   ```tsx
   <meta property="og:image" content="https://quidsafe.uk/assets/images/og-image.png" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   ```
4. Test with Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector

## Mobile app builds

### 7. EAS Build (iOS + Android)
Not yet configured for production builds. To ship native apps:

1. Sign up for [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Sign up for [Google Play Console](https://play.google.com/console/) ($25 one-time)
3. Configure EAS:
   ```bash
   npx expo install eas-cli
   eas login
   eas build:configure
   ```
4. Update `eas.json` with build profiles
5. Add production API URL to `app.json` extra
6. Build:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```
7. Submit:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Quick wins completed

- [x] Domain migration (quidsafe.uk)
- [x] Custom subdomains (api.quidsafe.uk, clerk.quidsafe.uk)
- [x] Cookie consent banner (UK GDPR)
- [x] Invoice email pipeline (worker + UI)
- [x] Clerk production instance
- [x] Landing page Apple-style redesign
- [x] Auth screens split-layout redesign
- [x] 404 page redesign
- [x] Sitemap + robots.txt audit
- [x] Favicon + PWA manifest fixes
- [x] Plausible analytics wired (needs account only)
- [x] Performance: batched D1 writes, dashboard memoisation, Google Fonts dedup
