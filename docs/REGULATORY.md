# QuidSafe — Regulatory & Compliance Guide

## 1. FCA (Financial Conduct Authority)

### Do We Need FCA Authorisation?
**No. QuidSafe is software, not an advisory service.**

QuidSafe is a tax calculation tool — it performs arithmetic based on HMRC-published rates. It does not provide financial advice, investment recommendations, or regulated services. This is the same category as spreadsheet software or a calculator.

**Why no FCA registration is needed:**
- We do NOT provide financial advice or recommendations
- We do NOT manage, hold, or move money
- We do NOT recommend financial products
- Open Banking access is handled entirely by TrueLayer (who ARE FCA-authorised as an AISP — ref FRN 901096)
- We are a "data consumer" via TrueLayer's regulated infrastructure
- Tax calculations are mathematical computations, not advice

**What we DO need:**
- TrueLayer API partnership agreement (they handle all FCA compliance)
- Display "Powered by TrueLayer" as per their branding requirements
- Clear disclaimers that this is software, not advice

### Disclaimers (Required in App + Website)
- "QuidSafe is a tax estimation tool. It is not financial advice."
- "Always verify with HMRC or a qualified accountant before filing."
- "Tax calculations are based on published HMRC rates and may change."

## 2. GDPR / UK GDPR

### Data We Collect
| Data | Lawful Basis | Retention |
|------|-------------|-----------|
| Email, name | Contractual necessity | Until account deletion |
| Bank transactions | Consent (Open Banking) | Until account deletion or consent withdrawn |
| Tax calculations | Contractual necessity | 7 years (HMRC requirement) |
| Device push tokens | Legitimate interest | Until app uninstalled |
| Usage analytics | Legitimate interest | 26 months |

### Required Documents
1. **Privacy Policy** — What data we collect, why, who sees it, user rights
2. **Terms of Service** — Service terms, liability limitations, subscription terms
3. **Cookie Policy** — If web app uses cookies (minimal — auth only)
4. **Data Processing Agreement** — With TrueLayer, Supabase, Stripe, Anthropic

### User Rights (implement in-app)
- **Right to access** — Export all data as JSON/CSV
- **Right to rectification** — Edit personal details
- **Right to erasure** — Delete account + all data within 30 days
- **Right to portability** — Download data in machine-readable format
- **Right to withdraw consent** — Disconnect bank at any time

### ICO Registration
- Register with the Information Commissioner's Office
- Annual fee: £40 (small org) or £60 (medium)
- Required before processing personal data

## 3. HMRC MTD Software Vendor

### Registration Process
1. Register as a software vendor at developer.service.hmrc.gov.uk
2. Complete the HMRC recognition process
3. Test in HMRC sandbox environment
4. Apply for production credentials
5. Get listed on HMRC's list of MTD-compatible software

### Requirements
- Software must be able to submit quarterly updates digitally
- Must maintain audit trail of all submissions
- Must handle HMRC error responses gracefully
- Must support Government Gateway OAuth login

## 4. PCI DSS

**Not required.** Stripe handles all payment card data. QuidSafe never sees, stores, or processes card numbers. Use Stripe Checkout (hosted) to avoid any PCI scope.

## 5. Consumer Rights

### Subscription Cancellation
- Users can cancel anytime via Stripe Customer Portal
- Access continues until end of billing period
- No penalty for cancellation
- Provide clear cancellation flow in Settings

### Refund Policy
- 14-day cooling-off period (Consumer Contracts Regulations 2013)
- Pro-rata refund if requested within 14 days
- After 14 days: no refund, but can cancel for next period

## 6. Checklist Before Launch

- [ ] Privacy Policy published and linked in app
- [ ] Terms of Service published and linked in app
- [ ] ICO registration completed (£40)
- [ ] TrueLayer partnership agreement signed
- [ ] HMRC software vendor registration (if MTD features at launch)
- [ ] Stripe webhook signatures verified
- [ ] Data encryption at rest confirmed (Supabase)
- [ ] Data encryption in transit confirmed (TLS 1.3)
- [ ] Right to delete implemented and tested
- [ ] Data export implemented and tested
- [ ] Tax disclaimer displayed on dashboard
- [ ] Cookie consent banner (web only, if needed)
- [ ] Vulnerability disclosure policy published
- [ ] Companies House registration (QUIDSAFE LTD)
