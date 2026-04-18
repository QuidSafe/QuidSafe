# Staging Access — Cloudflare Zero Trust

The staging **web frontend** (`staging.quidsafe.uk`) is gated by Cloudflare Access. Anyone hitting it gets a one-time-PIN login prompt before Pages serves anything.

The staging **API** (`api-staging.quidsafe.uk`) is NOT behind Access — it's protected the same way production is, via Clerk JWT verification in [worker/middleware/auth.ts](../../worker/middleware/auth.ts). We tried putting Access in front of the API too but it breaks browser `fetch()` calls from the staging web app (different hostname = no shared session cookie, cross-origin redirect to login can't be followed by JS). Keeping Access on the web only + Clerk on the API matches how real fintechs usually do this.

## Access policy

- **Application**: QuidSafe Staging (type: self-hosted)
- **Hostname**: `staging.quidsafe.uk`
- **Identity provider**: One-time PIN (code emailed to the allowed address)
- **Session duration**: 24h
- **Allowlist**: single email, `nathanlufc@gmail.com`

To view or edit: Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **QuidSafe Staging**.

## Adding a new user to staging

1. Cloudflare dashboard → Zero Trust → Access → Applications → **QuidSafe Staging**
2. Click **Policies** → **Owner only** → **Edit**
3. Under **Include** → **Emails**, add the new email
4. Save

The new user will get a PIN by email the next time they hit the staging URL.

## Removing access

Same path as above. Remove the email from the allowlist. Any existing browser session expires within 24h.

## What Access does NOT protect

- **Local development** (`localhost:8081`, `localhost:8787`) - no Access gate, just runs in your browser
- **Cloudflare Workers preview URLs** (`*.workers.dev`) - still publicly reachable unless a separate Access policy is added
- **Production** (`quidsafe.uk`) - intentionally open, it's the real app

## If you ever need to bypass Access temporarily

Don't. If something's urgent and the Access gate is in the way, add your secondary email to the allowlist instead. Never disable the Access application entirely.

## DNS records

- `api-staging.quidsafe.uk` - auto-created by wrangler on `deploy --env staging` (via `custom_domain = true` in [wrangler.worker.toml](../../wrangler.worker.toml))
- `staging.quidsafe.uk` - CNAME → `quidsafe.pages.dev`, proxied. Pages needs this to validate the custom domain before it'll serve SSL. If you add the custom domain via API rather than dashboard, create the CNAME manually.

If either record is missing, the hostname just 404s.

## Rotating the Cloudflare API token

The `CF_API_TOKEN` used to configure Access from the command line is not persistent - it's generated for a task and revoked. If you need to repeat the automation:

1. Cloudflare dashboard → Profile (top right) → **API Tokens**
2. Create a token with: `Access: Apps and Policies (Edit)`, `Access: Organizations, Identity Providers, and Groups (Edit)`
3. Set **TTL to 1 hour** - never create a no-expiry token
4. Use in a terminal env var only: `export CF_API_TOKEN="..."` - never commit, never paste into chat, never write to a file
5. Revoke immediately when done

## Debug - I can't reach staging even though I should be allowed

1. Open an incognito window - existing session cookies on your normal browser may conflict
2. Go to `https://staging.quidsafe.uk` - you should see a Cloudflare Access login page
3. Enter your allowlisted email, receive a PIN, enter it
4. You should now reach the real app
5. If you see a 1003 / "Direct IP access not allowed" error, the DNS record isn't set up - check Pages custom domains + wrangler deploy ran
6. If you see the Cloudflare login page but it rejects your PIN, the email you entered isn't in the policy allowlist - check the dashboard policy

## Related

- [wrangler.worker.toml](../../wrangler.worker.toml) - Worker route for `api-staging.quidsafe.uk`
- [components/ui/EnvBanner.tsx](../../components/ui/EnvBanner.tsx) - the warning bar shown on non-prod web builds
- [CLAUDE.md](../../CLAUDE.md) - project overview incl. staging protection model
