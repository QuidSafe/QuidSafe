# QuidSafe — Security Architecture

## Overview

QuidSafe handles the most sensitive financial data: bank transactions, income details, tax records, and HMRC credentials. Security is not a feature — it's the foundation. One breach means game over.

This document covers every layer of the security model.

---

## 1. AI Data Anonymisation Pipeline

**Core rule: Never send personal data to any AI API. Ever.**

### What Gets Stripped Before Claude API

| Data Field | Sent to AI? | Transformation |
|---|---|---|
| Transaction amount | Yes | Needed for categorisation |
| Merchant name | Anonymised | "DELIVEROO PAYMENTS LTD" → "FOOD_DELIVERY_PLATFORM" |
| User's name | Never | Stripped completely |
| Bank account numbers | Never | Stripped completely |
| Sort codes | Never | Stripped completely |
| Payee/payer names | Never | Replaced with "PERSONAL_PAYMENT" |
| Transaction descriptions | Sanitised | Personal names removed via regex, patterns kept |
| Transaction dates | Generalised | Full date only sent if needed, otherwise "Q1_2026" |
| Running balance | Never | Not relevant for categorisation |

### Anonymisation Implementation

```typescript
// lib/anonymiser.ts

interface RawTransaction {
  amount: number;
  description: string;
  merchantName?: string;
  transactionDate: string;
  direction: 'credit' | 'debit';
}

interface AnonymisedTransaction {
  id: string;           // "TX_001" — no real ID
  amount: number;
  merchantType: string; // Anonymised category
  direction: 'credit' | 'debit';
  pattern: string;      // Sanitised description
}

function anonymise(tx: RawTransaction): AnonymisedTransaction {
  return {
    id: generateOpaqueId(),
    amount: tx.amount,
    merchantType: anonymiseMerchant(tx.merchantName),
    direction: tx.direction,
    pattern: sanitiseDescription(tx.description),
  };
}

// Merchant anonymisation lookup
const MERCHANT_MAP: Record<string, string> = {
  'DELIVEROO': 'FOOD_DELIVERY_PLATFORM',
  'UBER': 'RIDE_HAILING_PLATFORM',
  'AMAZON': 'ONLINE_MARKETPLACE',
  'TESCO': 'SUPERMARKET',
  'NETFLIX': 'STREAMING_SERVICE',
  'ETSY': 'HANDMADE_MARKETPLACE',
  // ... 200+ mappings
};

// Description sanitisation — remove all personal names
function sanitiseDescription(desc: string): string {
  return desc
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'PERSON') // Names
    .replace(/\b\d{6,8}\b/g, 'REDACTED')                 // Account refs
    .replace(/\b[A-Z]{2}\d{2}\s?\d{4}\b/g, 'REDACTED')  // Sort codes
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/g, 'EMAIL_REDACTED');
}
```

### What Claude API Actually Receives

```json
{
  "transactions": [
    { "id": "TX_001", "amount": 450.00, "merchantType": "FOOD_DELIVERY_PLATFORM", "direction": "credit", "pattern": "PLATFORM PAYMENT" },
    { "id": "TX_002", "amount": 12.99, "merchantType": "STREAMING_SERVICE", "direction": "debit", "pattern": "MONTHLY SUBSCRIPTION" },
    { "id": "TX_003", "amount": 2400.00, "merchantType": "UNKNOWN", "direction": "credit", "pattern": "PERSON - SERVICE_PAYMENT" }
  ]
}
```

No names. No account numbers. No sort codes. No emails. Nothing that identifies the user.

### Claude API Zero Retention

- Use Anthropic's **zero data retention** API tier
- Anthropic does not store prompts or responses
- Anthropic does not train on your data
- Data exists only during the API call, then it's gone
- AI responses (category + confidence score) are stored locally — the prompt itself is never persisted

---

## 2. Encryption Architecture

### Data in Transit

| Connection | Protocol | Notes |
|---|---|---|
| User → Cloudflare | TLS 1.3 | Certificate pinning on mobile app |
| Cloudflare → Supabase | TLS 1.3 | End-to-end encrypted |
| Supabase → TrueLayer | TLS 1.3 | Mutual TLS where supported |
| Supabase → Claude API | TLS 1.3 | API key in header, not body |
| Supabase → Stripe | TLS 1.3 | Stripe handles all card data |
| Supabase → HMRC | TLS 1.2+ | Gov gateway requirements |

### Data at Rest

| Data | Encryption | Key Management |
|---|---|---|
| Bank access tokens | AES-256-GCM | Supabase Vault — separate encryption key per user |
| Bank refresh tokens | AES-256-GCM | Rotated on every use |
| HMRC OAuth tokens | AES-256-GCM | Separate key from bank tokens |
| Transaction data | AES-256 (disk-level) | Supabase managed (transparent encryption) |
| Tax calculations | AES-256 (disk-level) | Supabase managed |
| User PII (email, name) | AES-256 (disk-level) | Supabase managed |
| AI prompts | NOT STORED | Never written to disk or logs |
| AI responses (raw) | NOT STORED | Only category + confidence persisted |
| Backups | AES-256 | Encrypted at rest in Supabase |

### Token Handling — Decrypt in Memory Only

```typescript
// Bank tokens are NEVER written to logs, console, or error reports

async function syncBankTransactions(connectionId: string) {
  // 1. Fetch encrypted token from Supabase Vault
  const encryptedToken = await vault.getSecret(`bank_token_${connectionId}`);

  // 2. Decrypt in memory (Edge Function runtime)
  const accessToken = await decrypt(encryptedToken);

  // 3. Use token for API call
  const transactions = await truelayer.getTransactions(accessToken);

  // 4. Token is garbage collected when function ends
  // NEVER: console.log(accessToken)
  // NEVER: logger.info({ token: accessToken })
  // NEVER: Sentry.captureMessage(accessToken)
}
```

---

## 3. Database Security

### Row Level Security (RLS) — Every Table

```sql
-- Users can ONLY access their own data. No exceptions.

-- Transactions
CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (user_id = auth.uid());

-- Bank connections
CREATE POLICY "users_own_connections" ON bank_connections
  FOR ALL USING (user_id = auth.uid());

-- Tax calculations
CREATE POLICY "users_own_tax" ON tax_calculations
  FOR ALL USING (user_id = auth.uid());

-- MTD submissions
CREATE POLICY "users_own_submissions" ON mtd_submissions
  FOR ALL USING (user_id = auth.uid());

-- Subscriptions
CREATE POLICY "users_own_subscriptions" ON subscriptions
  FOR ALL USING (user_id = auth.uid());
```

Even if application code has a bug that runs `SELECT * FROM transactions`, RLS ensures only the authenticated user's rows are returned. Defence in depth.

### Database Access Controls

- No direct database access from client — all queries go through Edge Functions
- Database credentials stored in Supabase secrets — never in code
- Connection pooling via Supabase (PgBouncer) — prevents connection exhaustion
- Automated daily backups with 7-day retention (Supabase managed)
- Point-in-time recovery available on Pro tier

---

## 4. Authentication Security

| Measure | Implementation |
|---|---|
| **Password-less login** | Magic link (email) or Google OAuth — no passwords to store or leak |
| **JWT tokens** | Access token: 1 hour expiry. Refresh token: 7 days. |
| **Refresh token rotation** | Each refresh generates new token pair, old refresh token invalidated |
| **Token storage (mobile)** | Expo SecureStore (iOS Keychain / Android Keystore) — NOT AsyncStorage |
| **Token storage (web)** | HttpOnly, Secure, SameSite=Strict cookies — NOT localStorage |
| **Session invalidation** | User can revoke all sessions from Settings |
| **Rate limiting (auth)** | 10 attempts per minute per IP |
| **Brute force protection** | Account locked after 5 failed attempts for 15 minutes |
| **Magic link expiry** | 10 minutes, single use |

---

## 5. API Security

| Threat | Mitigation |
|---|---|
| **DDoS** | Cloudflare WAF (free tier includes basic protection) |
| **Rate limiting** | Per-user: 100 req/min. Per-IP: 200 req/min. Via Supabase rate limiting. |
| **SQL injection** | Impossible — Supabase uses parameterised queries exclusively |
| **XSS** | React Native auto-escapes rendered content. CSP headers on web. |
| **CSRF** | SameSite cookies + origin checking |
| **CORS** | Locked to quidsafe.co.uk + mobile app bundle IDs only |
| **Input validation** | Zod schemas on every Edge Function — reject malformed data before processing |
| **Webhook spoofing** | Stripe: signature verification (HMAC-SHA256). TrueLayer: webhook signing key verification. |
| **Secrets in code** | All secrets in Supabase environment variables. Git hooks prevent commits containing keys. |
| **Dependency vulnerabilities** | GitHub Dependabot + `npm audit` on every CI run. Auto-PRs for critical patches. |
| **Error leaking** | Production errors return generic messages. Full details only in Sentry (internal). |

---

## 6. Infrastructure Security

### Supabase Security Features (Included)

- SOC 2 Type II certified
- Data encrypted at rest (AES-256)
- Network isolation between projects
- Automated security patches
- DDoS protection
- Audit logging

### Cloudflare Security Features (Free Tier)

- SSL/TLS termination
- DDoS mitigation (Layer 3/4/7)
- Bot management
- WAF rules (basic)
- DNSSEC

### Mobile App Security

| Measure | Implementation |
|---|---|
| **Certificate pinning** | Pin Supabase and API certificates in Expo config |
| **Jailbreak/root detection** | Warn users on compromised devices |
| **App Transport Security** | Enforced on iOS (HTTPS only) |
| **ProGuard/R8** | Code obfuscation on Android release builds |
| **Biometric lock** | Optional Face ID / fingerprint to open app |
| **Screenshot prevention** | Prevent screenshots of sensitive screens (tax data, bank info) |
| **Secure clipboard** | Clear clipboard after 60 seconds if user copies sensitive data |

---

## 7. Data Retention & GDPR Compliance

| Data | Retention Period | Deletion Method |
|---|---|---|
| Bank tokens | Until user disconnects bank | Immediate purge from Vault |
| Transactions | Duration of account | Within 30 days of account deletion |
| Tax calculations | 7 years (HMRC legal requirement) | Auto-purge after 7 years |
| HMRC submissions | 7 years (HMRC legal requirement) | Auto-purge after 7 years |
| AI prompts | Not stored | Never persisted — exists only during API call |
| AI responses (raw) | Not stored | Only category + confidence score saved |
| User account data | Duration of account | Within 30 days of deletion request |
| Application logs | 90 days (anonymised) | Auto-purge |
| Error reports (Sentry) | 90 days | Auto-purge, no PII in reports |

### User Rights Implementation

- **Right to access** — "Download my data" button in Settings → exports JSON/CSV
- **Right to rectification** — Edit personal details in Settings
- **Right to erasure** — "Delete my account" in Settings → 30-day full purge
- **Right to portability** — Data export in machine-readable format
- **Right to withdraw consent** — Disconnect bank anytime, revoke HMRC access anytime

---

## 8. Logging & Monitoring Security

### What We Log (Anonymised)

- API endpoint called + HTTP status code
- Response time
- Error type (NOT error details containing user data)
- Authentication events (login, logout, failed attempt)
- Rate limit hits

### What We NEVER Log

- Bank tokens or credentials
- Transaction amounts or details
- User names or emails
- AI prompts or responses
- HMRC credentials
- Request/response bodies containing PII
- Full stack traces in production (Sentry only)

### Monitoring Alerts

| Alert | Trigger | Action |
|---|---|---|
| Failed login spike | >20 failures in 5 minutes from same IP | Block IP for 1 hour |
| Unusual API usage | >500 requests from single user in 1 minute | Rate limit + investigate |
| Database query anomaly | Query returns >1000 rows (should never happen with RLS) | Alert + investigate |
| Edge Function error spike | >5% error rate over 10 minutes | Alert on-call |
| SSL certificate expiry | 14 days before expiry | Auto-renew via Cloudflare |

---

## 9. Pre-Launch Security Checklist

- [ ] Third-party penetration test completed (~£2-5k budget)
- [ ] OWASP Top 10 review passed
- [ ] All development secrets rotated to production values
- [ ] RLS policies tested — verified cross-user data isolation
- [ ] AI anonymisation tested — confirmed no PII in Claude API logs
- [ ] Stripe webhook signature verification working
- [ ] TrueLayer token encryption/decryption tested
- [ ] Rate limiting tested under load
- [ ] GDPR data export tested — complete and accurate
- [ ] GDPR data deletion tested — verified full purge across all tables
- [ ] Error messages reviewed — no internal details leaked to client
- [ ] Git history scanned for leaked secrets (trufflehog / git-secrets)
- [ ] SSL Labs score: A+ (ssllabs.com)
- [ ] Security headers configured: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [ ] ICO registration completed
- [ ] Privacy policy reviewed by legal
- [ ] Cookie consent implemented (web only)
- [ ] Vulnerability disclosure policy published
- [ ] Incident response plan documented

---

## 10. User-Facing Trust Page Content

Display on website and in-app Settings → Security:

> **How we protect your data**
>
> - All data encrypted with AES-256 — the same standard used by banks
> - We never see your bank login — TrueLayer (FCA authorised, FRN 901096) handles that securely
> - Our AI never sees your name, account number, or any personal details — transactions are anonymised before analysis
> - Your data is stored on UK/EU servers, never transferred outside the UK/EEA
> - We don't sell your data. We don't share it. We don't use it for advertising. Ever.
> - You can delete everything with one tap — we remove it within 30 days
> - We're ICO registered and fully UK GDPR compliant
> - Login is password-free — magic link or Google sign-in, so there's no password to steal
>
> Questions about security? Email security@quidsafe.co.uk

---

## 11. Competitive Security Advantage

| Factor | QuidSafe | QuickBooks | Coconut | FreeAgent |
|---|---|---|---|---|
| **HQ / Data location** | UK | US (Intuit) | UK | UK |
| **AI data handling** | Anonymised, zero retention | Unknown | No AI | No AI |
| **Password-less auth** | Yes (magic link) | No (password) | No (password) | No (password) |
| **Row Level Security** | Yes (database-enforced) | Unknown | Unknown | Unknown |
| **Open source security model** | Documented publicly | Closed | Closed | Closed |
| **User data export** | One-tap JSON/CSV | Manual request | Manual | Available |
| **Account deletion** | One-tap, 30-day purge | Manual request | Manual | Manual |

This is a genuine differentiator. "UK-built, UK-hosted, AI-anonymised by design" is a powerful trust message against American-owned competitors.
