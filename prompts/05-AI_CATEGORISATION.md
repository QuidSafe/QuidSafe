# Prompt 05 — AI Transaction Categorisation (Security-First)

## Context
After syncing bank transactions, QuidSafe uses Claude Haiku to categorise each transaction as income, personal spending, or a claimable business expense. This is the AI core of the product.

**CRITICAL SECURITY REQUIREMENT:** All transaction data MUST be anonymised before sending to Claude API. No personal names, account numbers, sort codes, or identifying information may ever leave the QuidSafe infrastructure.

## Task
Build the AI categorisation pipeline in `lib/categoriser.ts` and the anonymisation layer in `lib/anonymiser.ts`.

## Requirements

### 0. Anonymisation Layer (BUILD THIS FIRST)

Create `lib/anonymiser.ts` that strips all PII before any data reaches Claude API:

```typescript
// Merchant name → generic category
"DELIVEROO PAYMENTS LTD" → "FOOD_DELIVERY_PLATFORM"
"MRS KAREN JONES"        → "PERSONAL_PAYMENT"
"AMAZON.CO.UK"           → "ONLINE_MARKETPLACE"

// Description sanitisation
"PAYMENT FROM JOHN SMITH REF 12345678" → "PAYMENT FROM PERSON REF REDACTED"
"TFR TO 12-34-56 87654321"            → "TFR TO REDACTED REDACTED"

// Email removal
"INVOICE payment@karen.com" → "INVOICE EMAIL_REDACTED"
```

Build a merchant lookup map (200+ UK merchants → anonymous categories). Use regex patterns to catch personal names, account numbers, sort codes, and emails.

### 1. Categorisation Logic
For each uncategorised transaction, **anonymise first**, then send to Claude Haiku API:

```
You are a UK tax categorisation assistant for sole traders.

Given this anonymised bank transaction, classify it:
- "income" — money received for work/services/sales
- "personal" — personal spending (groceries, rent, subscriptions, etc.)
- "business_expense" — money spent to earn income (fuel, phone bill, equipment, etc.)

Also identify the income source type if applicable (e.g., "gig_delivery", "ecommerce", "freelance_service", "cleaning").

Transaction:
- Amount: £{amount}
- Merchant type: "{anonymised_merchant_type}"
- Pattern: "{sanitised_description}"
- Direction: {credit/debit}

Respond ONLY in JSON:
{
  "category": "income" | "personal" | "business_expense",
  "confidence": 0.0-1.0,
  "income_source_type": "string or null",
  "reasoning": "brief explanation"
}
```

### 2. Claude API Configuration
- Use **zero data retention** API option
- Set `max_tokens: 200` (responses are short)
- Use Haiku model for speed and cost
- Never log prompts or responses containing even anonymised transaction data
- API key stored in Supabase secrets, never in code

### 2. Batch Processing
- Process transactions in batches of 20-50 to reduce API calls
- Use a single prompt with multiple transactions listed
- Parse the array response and match back to transaction IDs
- Estimated cost: ~£0.001 per transaction at Haiku pricing

### 3. Confidence Thresholds
- `confidence >= 0.85` → Auto-accept categorisation
- `0.60 <= confidence < 0.85` → Accept but flag for user review
- `confidence < 0.60` → Mark as "uncategorised", ask user

### 4. User Corrections
- `PUT /transactions/:id/category` — User manually overrides a category
- Store the correction as training signal
- When user corrects, add to a `category_corrections` table
- Use corrections to improve future prompts (few-shot examples)

### 5. Smart Patterns
Build a local rules engine that runs BEFORE the AI call to catch obvious patterns:
- Amount is positive (credit) → likely income
- Merchant contains "UBER", "DELIVEROO", "ETSY" → income
- Merchant contains "TESCO", "AMAZON", "NETFLIX" → personal
- Description contains "SALARY", "INVOICE", "PAYMENT RECEIVED" → income
- Use rules for high-confidence matches, AI for ambiguous ones

### 6. Rate Limiting
- Max 1000 Claude API calls per user per day
- Queue excess for next processing window
- Track API spend per user in Redis

## Output
Categoriser service, batch processing logic, rules engine, user correction endpoint, and tests.
