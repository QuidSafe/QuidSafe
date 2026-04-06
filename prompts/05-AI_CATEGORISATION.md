# Prompt 05 — AI Transaction Categorisation (Security-First)

## Context
After syncing bank transactions, QuidSafe uses Claude Haiku to categorise each transaction as income, personal spending, or a claimable business expense. This is the AI core of the product.

**CRITICAL SECURITY REQUIREMENT:** All transaction data MUST be anonymised before sending to Claude API. No personal names, account numbers, sort codes, or identifying information may ever leave the QuidSafe infrastructure.

## Stack
- **Anonymiser:** `worker/services/anonymiser.ts`
- **Categoriser:** `worker/services/categoriser.ts`
- **API Routes:** `worker/index.ts` (categorise, uncategorised, category override)
- **AI Model:** Claude Haiku 4.5 via Anthropic Messages API
- **Frontend:** `lib/api.ts` (categoriseTransactions, getUncategorised, overrideCategory)

## Implementation

### 0. Anonymisation Layer (`worker/services/anonymiser.ts`)

Strips ALL PII before any data reaches Claude API:

**Merchant lookup map** (100+ UK merchants -> anonymous categories):
```
"DELIVEROO PAYMENTS LTD" -> "GIG_DELIVERY_PLATFORM"
"MRS KAREN JONES"        -> "PERSONAL_PAYMENT"
"AMAZON.CO.UK"           -> "ONLINE_MARKETPLACE"
```

Categories: GIG_DELIVERY_PLATFORM, GIG_RIDE_PLATFORM, ECOMMERCE_MARKETPLACE, FREELANCE_PLATFORM, SUPERMARKET, FAST_FOOD, COFFEE_SHOP, ENTERTAINMENT_SUBSCRIPTION, SOFTWARE_SUBSCRIPTION, FUEL_STATION, PUBLIC_TRANSPORT, TELECOM_PROVIDER, TRADE_SUPPLIES, OFFICE_SUPPLIES, etc.

**PII removal patterns** (regex):
- UK sort codes (`12-34-56`) -> `REDACTED_SORT_CODE`
- Account numbers (8 digits) -> `REDACTED_ACCOUNT`
- Emails -> `EMAIL_REDACTED`
- Phone numbers (UK format) -> `PHONE_REDACTED`
- Reference numbers -> `REF REDACTED`
- Personal names (MR/MRS/DR prefix) -> `PERSONAL_PAYMENT`
- Partial card numbers -> `CARD_REDACTED`

**Functions:**
- `anonymiseMerchant(merchantName)` — lookup table + partial match + fallback
- `sanitiseDescription(description)` — regex PII stripping
- `anonymiseTransaction(tx)` — full anonymisation returning `{ amount, merchantType, pattern, direction }`

### 1. Rules Engine (runs BEFORE AI call)

High-confidence patterns that skip the AI:

| Rule | Category | Confidence |
|------|----------|------------|
| Credit from known income platform (Deliveroo, Uber, Etsy, etc.) | income | 0.95 |
| Debit to known personal merchant (supermarket, coffee, Netflix, etc.) | personal | 0.92 |
| Description matches income pattern (SALARY, INVOICE, etc.) | income | 0.88 |
| Description matches personal pattern (RENT, MORTGAGE, GYM, etc.) | personal | 0.88 |

### 2. AI Categorisation (Claude Haiku)

For transactions the rules engine can't handle:

- **Model:** `claude-haiku-4-5-20251001`
- **Max tokens:** 2048 (batch responses)
- **Batch size:** 30 transactions per API call
- **API key:** Stored in `ANTHROPIC_API_KEY` env var (wrangler secret)
- **Few-shot learning:** User corrections from `category_corrections` table injected into prompt

**Prompt structure:**
```
You are a UK tax categorisation assistant for sole traders.
[User's correction history as few-shot examples]
Transactions:
1. ID: ... | Amount: £X | Merchant: "ANONYMISED" | Pattern: "SANITISED" | Direction: credit/debit
Respond ONLY with JSON array.
```

### 3. Confidence Thresholds

| Threshold | Action |
|-----------|--------|
| >= 0.85 | Auto-accept — saved directly to DB |
| 0.60 - 0.84 | Accept but flagged for user review |
| < 0.60 | Marked as uncategorised — user must decide |

### 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/transactions/categorise` | POST | Trigger categorisation for all uncategorised transactions (max 200). Loads user corrections for few-shot prompting. Returns counts: autoAccepted, flaggedForReview, uncategorised. |
| `/transactions/uncategorised` | GET | List transactions with null category or confidence < 0.60 |
| `/transactions/:id/category` | PUT | User manually overrides category. Records correction in `category_corrections` for AI learning. |

### 5. User Corrections & AI Learning

When a user corrects a category:
1. Updates the transaction's `ai_category` and sets `user_override = 1`
2. If the AI had a different prediction, records to `category_corrections` table:
   - `original_category` — what AI predicted
   - `corrected_category` — what user chose
   - `merchant_name` — for pattern matching
3. On next categorisation run, corrections are loaded as few-shot examples in the Claude prompt

### 6. Error Handling

- If Claude API fails, transactions are marked with `confidence: 0.0` and category defaulted to `personal`
- JSON parsing handles markdown code blocks in Claude's response
- Batch failures don't block other batches

## Files

| File | Purpose |
|------|---------|
| `worker/services/anonymiser.ts` | PII removal + merchant lookup (100+ UK merchants) |
| `worker/services/categoriser.ts` | Rules engine + Claude API batching + few-shot learning |
| `worker/index.ts` | API routes (categorise, uncategorised, override) |
| `worker/migrations/002_full_schema.sql` | `category_corrections` table |
| `lib/api.ts` | Frontend client methods |
