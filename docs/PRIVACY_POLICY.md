# QuidSafe — Privacy Policy

**Last updated:** April 2026
**Data Controller:** QuidSafe Ltd
**Contact:** privacy@quidsafe.co.uk
**ICO Registration:** [Pending — to be registered before launch]

---

## 1. Who We Are

QuidSafe Ltd ("we", "us") is a UK company providing tax estimation and record-keeping software for sole traders. We are the data controller for the personal data described in this policy.

---

## 2. What Data We Collect

### 2.1 Data You Provide
| Data | Purpose | Lawful Basis |
|------|---------|-------------|
| Email address | Account creation, login, notifications | Contractual necessity |
| Full name | Personalisation, HMRC submissions | Contractual necessity |
| UTR number | HMRC MTD submissions | Contractual necessity |
| HMRC Government Gateway credentials | MTD submissions (OAuth token only) | Contractual necessity |
| Invoice details (client names, amounts) | Invoicing feature | Contractual necessity |
| Manually added expenses | Expense tracking | Contractual necessity |
| Receipt photos | Expense evidence | Contractual necessity |

### 2.2 Data Collected Automatically
| Data | Purpose | Lawful Basis |
|------|---------|-------------|
| Bank transactions (via Open Banking) | Income/expense categorisation, tax calculation | Consent (Open Banking authorisation) |
| Device push token | Push notifications | Legitimate interest |
| App usage analytics (anonymised) | Product improvement | Legitimate interest |
| Device type, OS version | Bug fixing, compatibility | Legitimate interest |
| IP address (on login only) | Security, fraud prevention | Legitimate interest |

### 2.3 Data We Do NOT Collect
- Bank login credentials (handled entirely by TrueLayer)
- Payment card numbers (handled entirely by Stripe)
- Location data
- Contacts, photos (except receipts you choose to upload), or messages
- Biometric data (Face ID/fingerprint processed on-device only, never transmitted)

---

## 3. How We Use Your Data

| Purpose | Data Used | Retention |
|---------|-----------|-----------|
| Provide the Service | Account details, transactions, tax calculations | Duration of account |
| Calculate tax estimates | Income, expenses | Duration of account |
| Submit MTD updates to HMRC | Income, expenses, UTR, HMRC token | 7 years (HMRC requirement) |
| Send notifications | Email, push token | Duration of account |
| AI transaction categorisation | **Anonymised** transaction data only | Not stored (zero retention) |
| Process payments | Email (Stripe handles card data) | Duration of subscription |
| Improve the Service | Anonymised usage analytics | 26 months |
| Prevent fraud | IP address, login patterns | 12 months |

---

## 4. AI and Anonymisation

We use Anthropic's Claude AI to categorise bank transactions. **Your personal data is never sent to any AI provider.** Before any data reaches the AI:

- Your name is stripped
- Account numbers and sort codes are removed
- Payee/payer names are replaced with generic labels
- Email addresses are removed
- Only anonymised amounts, merchant categories, and transaction patterns are sent
- Anthropic operates under a zero data retention agreement — they do not store or train on your data

See our Security Architecture document for the full anonymisation pipeline.

---

## 5. Who We Share Data With

| Recipient | What They Receive | Why | Their Privacy Policy |
|-----------|-------------------|-----|---------------------|
| **TrueLayer** | OAuth tokens (to access your bank) | Open Banking provider | truelayer.com/privacy |
| **HMRC** | Income, expenses (when you submit) | MTD compliance | gov.uk/government/organisations/hm-revenue-customs/about/personal-information-charter |
| **Stripe** | Email address | Payment processing | stripe.com/privacy |
| **Anthropic** | Anonymised transaction patterns only | AI categorisation | anthropic.com/privacy |
| **Supabase** | All stored data (encrypted) | Database hosting | supabase.com/privacy |
| **Resend** | Email address | Transactional emails | resend.com/legal/privacy-policy |
| **Sentry** | Error data (no PII) | Error tracking | sentry.io/privacy |

We do NOT sell your data. We do NOT share it with advertisers. We do NOT use it for marketing by third parties.

---

## 6. Data Storage and Security

- All data is stored on servers in the UK/EU (Supabase, EU region)
- All data is encrypted at rest using AES-256
- All data in transit is encrypted using TLS 1.3
- Bank tokens are encrypted with separate keys via Supabase Vault
- Row Level Security ensures users can only access their own data
- See our Security Architecture document for full details

---

## 7. Data Retention

| Data | Retention Period | Reason |
|------|-----------------|--------|
| Account data | Until you delete your account | Service provision |
| Bank transactions | Until you delete your account | Service provision |
| Tax calculations | 7 years after the relevant tax year | HMRC legal requirement |
| HMRC submissions | 7 years after the relevant tax year | HMRC legal requirement |
| AI processing data | Not stored | Zero retention policy |
| Application logs | 90 days (anonymised) | Debugging |
| Deleted account data | Purged within 30 days of deletion request | GDPR compliance |

---

## 8. Your Rights (UK GDPR)

You have the right to:

| Right | How to Exercise | Timeline |
|-------|----------------|----------|
| **Access** your data | Settings → Export my data (or email privacy@quidsafe.co.uk) | Within 30 days |
| **Rectify** inaccurate data | Edit in Settings → Profile | Immediate |
| **Delete** your data | Settings → Delete my account (or email us) | Within 30 days |
| **Port** your data | Settings → Export my data (CSV/JSON format) | Within 30 days |
| **Withdraw consent** | Disconnect bank in Settings / delete account | Immediate |
| **Object** to processing | Email privacy@quidsafe.co.uk | Within 30 days |
| **Complain** to the ICO | ico.org.uk/make-a-complaint | N/A |

We will never charge you for exercising your rights.

---

## 9. Cookies

### Web App (quidsafe.co.uk)
| Cookie | Purpose | Type | Duration |
|--------|---------|------|----------|
| `sb-auth-token` | Authentication session | Essential | Session |
| `theme` | Light/dark mode preference | Functional | 1 year |

We do NOT use advertising cookies, tracking cookies, or third-party analytics cookies.

### Mobile App
The mobile app does not use cookies. Authentication tokens are stored securely in the device keychain (iOS) or keystore (Android).

---

## 10. Children

QuidSafe is not intended for use by anyone under 18. We do not knowingly collect data from children. If we discover we have collected data from a child, we will delete it promptly.

---

## 11. International Transfers

Your data is stored in the UK/EU and is not transferred outside the UK/EEA. Our AI provider (Anthropic) processes anonymised data only — no personal data leaves the UK/EEA.

---

## 12. Changes to This Policy

We may update this policy from time to time. We will notify you of material changes via email and in-app notification at least 14 days before they take effect.

---

## 13. Contact

**Data Protection queries:**
- Email: privacy@quidsafe.co.uk
- Postal: QuidSafe Ltd, [registered address]

**To complain to the regulator:**
- Information Commissioner's Office (ICO)
- ico.org.uk/make-a-complaint
- Telephone: 0303 123 1113
