# QuidSafe — Technical Specification

## 1. API Specification

### Base URL
- Development: `http://localhost:3000`
- Production: `https://api.quidsafe.co.uk`

### Authentication
All endpoints (except `/health`, `/auth/*`) require:
```
Authorization: Bearer <supabase_jwt_token>
```

### Endpoints

#### Health
```
GET /health
→ 200 { "status": "ok", "version": "0.1.0" }
```

#### Auth
```
POST /auth/signup          — Create user after Supabase auth
POST /auth/session         — Validate JWT, return profile
PUT  /auth/onboarding      — Update onboarding step
DELETE /auth/account        — Delete account (GDPR)
```

#### Dashboard
```
GET /dashboard             — All dashboard data (single call)
→ 200 {
    user: { name, tier },
    tax: { totalOwed, incomeTax, ni, setAsideMonthly, plainEnglish },
    income: { total, bySource: [...], byMonth: [...] },
    actions: [...],
    quarters: { current, timeline: [...] }
  }
```

#### Banking
```
GET    /banking/connect           — Get TrueLayer auth URL
GET    /banking/callback          — OAuth callback handler
GET    /banking/connections       — List connected banks
DELETE /banking/connections/:id   — Disconnect bank
POST   /banking/sync/:id         — Force sync transactions
```

#### Transactions
```
GET /transactions                 — List (paginated, filterable by date, type, source)
GET /transactions/uncategorised   — Needs user review
PUT /transactions/:id/category    — Override AI category
```

#### Expenses
```
GET    /expenses                  — List claimed expenses (paginated, filterable)
POST   /expenses                  — Add expense manually
POST   /expenses/receipt          — Upload receipt image for AI extraction
PUT    /expenses/:id              — Edit expense
DELETE /expenses/:id              — Remove expense
GET    /expenses/summary          — Total claimed + tax saved
GET    /expenses/categories       — Breakdown by HMRC category
```

#### Invoices
```
GET    /invoices                  — List all invoices (filterable by status)
POST   /invoices                  — Create new invoice
PUT    /invoices/:id              — Edit invoice
DELETE /invoices/:id              — Delete draft invoice
POST   /invoices/:id/send        — Send invoice via email
POST   /invoices/:id/remind      — Send payment reminder
GET    /invoices/summary          — Outstanding + paid totals
```

#### Tax
```
GET /tax/calculation              — Latest tax calculation
GET /tax/quarterly                — Quarter-by-quarter breakdown
GET /tax/history                  — Past tax years
```

#### MTD
```
GET  /mtd/connect                 — HMRC OAuth link
GET  /mtd/obligations             — Due/submitted quarters
POST /mtd/submit                  — Submit quarterly update
GET  /mtd/submissions/:id         — Submission details
```

#### Billing
```
POST /billing/checkout            — Stripe Checkout session
POST /billing/portal              — Stripe Customer Portal
GET  /billing/status              — Current subscription
POST /webhooks/stripe             — Stripe webhooks
```

#### Settings
```
GET  /settings                    — User preferences
PUT  /settings                    — Update preferences
PUT  /settings/notifications      — Toggle notification types
```

## 2. Data Models (TypeScript)

```typescript
// packages/shared/src/types.ts

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'pro';
  onboardingCompleted: boolean;
  createdAt: Date;
}

interface BankConnection {
  id: string;
  bankName: string;
  lastSyncedAt: Date;
  active: boolean;
  transactionCount: number;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  merchantName?: string;
  aiCategory: 'income' | 'personal' | 'business_expense';
  aiConfidence: number;
  isIncome: boolean;
  incomeSource?: string;
  transactionDate: string;
}

interface TaxCalculation {
  taxYear: string;
  quarter: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  incomeTax: number;
  niClass2: number;
  niClass4: number;
  totalTaxOwed: number;
  setAsideMonthly: number;
  plainEnglish: string;
}

interface DashboardData {
  user: Pick<User, 'name' | 'subscriptionTier'>;
  tax: TaxCalculation;
  income: {
    total: number;
    bySource: { name: string; amount: number; percentage: number }[];
    byMonth: { month: string; income: number; expenses: number }[];
  };
  actions: ActionItem[];
  quarters: QuarterTimeline;
}
```

## 3. Validation (Zod Schemas)

```typescript
// packages/shared/src/validation.ts
import { z } from 'zod';

export const categoryOverrideSchema = z.object({
  category: z.enum(['income', 'personal', 'business_expense']),
  incomeSource: z.string().optional(),
});

export const settingsUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notifications: z.object({
    deadlineReminders: z.boolean(),
    weeklySummary: z.boolean(),
    taxPotCheck: z.boolean(),
    mtdReady: z.boolean(),
  }).optional(),
});
```

## 4. Error Response Format

```json
{
  "error": {
    "code": "BANK_CONNECTION_EXPIRED",
    "message": "Your Monzo connection needs to be refreshed.",
    "action": "reconnect_bank",
    "details": {}
  }
}
```

Standard error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `BANK_CONNECTION_EXPIRED`, `RATE_LIMITED`, `HMRC_ERROR`, `INTERNAL_ERROR`.

## 5. Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth | 10 | 1 minute |
| Dashboard | 60 | 1 minute |
| Banking sync | 5 | 1 hour |
| Transactions | 100 | 1 minute |
| MTD submit | 3 | 1 hour |
| Billing | 10 | 1 minute |

## 6. Performance Targets

| Metric | Target |
|--------|--------|
| Dashboard load (API) | < 200ms |
| Transaction sync (100 txns) | < 5s |
| AI categorisation (batch 50) | < 3s |
| Tax calculation | < 50ms |
| App cold start | < 2s |
| Time to interactive | < 3s |
