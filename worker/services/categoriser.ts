// AI Transaction Categoriser — Uses Claude Haiku via Anthropic API
// All data is anonymised BEFORE reaching this module (see anonymiser.ts)

import { anonymiseTransaction, anonymiseMerchant } from './anonymiser';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnonymisedTx {
  id: string;
  amount: number;
  merchantType: string;
  pattern: string;
  direction: 'credit' | 'debit';
}

interface CategorisationResult {
  id: string;
  category: 'income' | 'personal' | 'business_expense';
  confidence: number;
  incomeSourceType: string | null;
  reasoning: string;
}

// ─── Rules Engine (runs BEFORE AI call) ───────────────────
// High-confidence patterns that don't need AI

const INCOME_MERCHANT_TYPES = new Set([
  'GIG_DELIVERY_PLATFORM',
  'GIG_RIDE_PLATFORM',
  'ECOMMERCE_MARKETPLACE',
  'FREELANCE_PLATFORM',
  'PET_SERVICES_PLATFORM',
  'SERVICES_MARKETPLACE',
  'PAYMENT_PROCESSOR',
]);

const PERSONAL_MERCHANT_TYPES = new Set([
  'SUPERMARKET',
  'ONLINE_GROCERY',
  'FAST_FOOD',
  'RESTAURANT',
  'BAKERY',
  'COFFEE_SHOP',
  'ENTERTAINMENT_SUBSCRIPTION',
  'CLOTHING_RETAILER',
  'PHARMACY',
  'DEPARTMENT_STORE',
]);

const INCOME_PATTERNS = [/SALARY/i, /INVOICE/i, /PAYMENT RECEIVED/i, /FEE INCOME/i, /CLIENT/i];
const PERSONAL_PATTERNS = [/RENT/i, /MORTGAGE/i, /COUNCIL TAX/i, /TV LICENCE/i, /GYM/i];

function applyRules(tx: AnonymisedTx): CategorisationResult | null {
  // Credit from known income platforms → income
  if (tx.direction === 'credit' && INCOME_MERCHANT_TYPES.has(tx.merchantType)) {
    return {
      id: tx.id,
      category: 'income',
      confidence: 0.95,
      incomeSourceType: tx.merchantType.toLowerCase(),
      reasoning: 'Credit from known income platform',
    };
  }

  // Debit to known personal merchants → personal
  if (tx.direction === 'debit' && PERSONAL_MERCHANT_TYPES.has(tx.merchantType)) {
    return {
      id: tx.id,
      category: 'personal',
      confidence: 0.92,
      incomeSourceType: null,
      reasoning: 'Debit to known personal spending category',
    };
  }

  // Description pattern matches
  for (const pattern of INCOME_PATTERNS) {
    if (pattern.test(tx.pattern)) {
      return {
        id: tx.id,
        category: 'income',
        confidence: 0.88,
        incomeSourceType: null,
        reasoning: 'Description matches income pattern',
      };
    }
  }

  for (const pattern of PERSONAL_PATTERNS) {
    if (pattern.test(tx.pattern)) {
      return {
        id: tx.id,
        category: 'personal',
        confidence: 0.88,
        incomeSourceType: null,
        reasoning: 'Description matches personal spending pattern',
      };
    }
  }

  return null; // Ambiguous — needs AI
}

// ─── AI Categorisation ────────────────────────────────────

interface CorrectionExample {
  merchantName: string;
  category: string;
}

function buildPrompt(transactions: AnonymisedTx[], corrections?: CorrectionExample[]): string {
  const txList = transactions
    .map(
      (tx, i) =>
        `${i + 1}. ID: ${tx.id} | Amount: £${tx.amount.toFixed(2)} | Merchant: "${tx.merchantType}" | Pattern: "${tx.pattern}" | Direction: ${tx.direction}`,
    )
    .join('\n');

  let fewShot = '';
  if (corrections && corrections.length > 0) {
    const examples = corrections
      .slice(0, 10)
      .map((c) => `- "${anonymiseMerchant(c.merchantName)}" → ${c.category}`)
      .join('\n');
    fewShot = `\nThis user has previously corrected these merchants:\n${examples}\nUse these as guidance for similar transactions.\n`;
  }

  return `You are a UK tax categorisation assistant for sole traders.

For each anonymised bank transaction below, classify it as:
- "income" — money received for work/services/sales
- "personal" — personal spending (groceries, rent, subscriptions, etc.)
- "business_expense" — money spent to earn income (fuel, phone bill, equipment, tools, etc.)

Also identify the income source type if applicable (e.g., "gig_delivery", "ecommerce", "freelance_service").
${fewShot}
Transactions:
${txList}

Respond ONLY with a JSON array:
[
  { "id": "...", "category": "income|personal|business_expense", "confidence": 0.0-1.0, "income_source_type": "string or null", "reasoning": "brief explanation" }
]`;
}

async function callClaude(
  prompt: string,
  apiKey: string,
): Promise<CategorisationResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'zero-data-retention-2025-04-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
  };

  const text = data.content[0]?.text ?? '[]';
  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const results = JSON.parse(jsonMatch[0]) as {
    id: string;
    category: string;
    confidence: number;
    income_source_type: string | null;
    reasoning: string;
  }[];

  return results.map((r) => ({
    id: r.id,
    category: r.category as 'income' | 'personal' | 'business_expense',
    confidence: r.confidence,
    incomeSourceType: r.income_source_type,
    reasoning: r.reasoning,
  }));
}

// ─── Public API ───────────────────────────────────────────

/**
 * Categorise a batch of transactions.
 * 1. Anonymise all transactions
 * 2. Apply rules engine for high-confidence matches
 * 3. Send ambiguous ones to Claude Haiku
 * 4. Merge results
 */
export async function categoriseTransactions(
  transactions: { id: string; amount: number; description: string; merchantName?: string | null }[],
  anthropicApiKey: string,
  corrections?: CorrectionExample[],
): Promise<CategorisationResult[]> {
  const results: CategorisationResult[] = [];
  const needsAI: AnonymisedTx[] = [];

  // Phase 1: Anonymise and apply rules
  for (const tx of transactions) {
    const anon = anonymiseTransaction(tx);
    const anonTx: AnonymisedTx = { id: tx.id, ...anon };

    const ruleResult = applyRules(anonTx);
    if (ruleResult) {
      results.push(ruleResult);
    } else {
      needsAI.push(anonTx);
    }
  }

  // Phase 2: AI categorisation for ambiguous transactions (batches of 30, max 3 concurrent)
  if (needsAI.length > 0) {
    const BATCH_SIZE = 30;
    const CONCURRENCY = 3;

    const batches: AnonymisedTx[][] = [];
    for (let i = 0; i < needsAI.length; i += BATCH_SIZE) {
      batches.push(needsAI.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const chunk = batches.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (batch) => {
          const prompt = buildPrompt(batch, corrections);
          try {
            return await callClaude(prompt, anthropicApiKey);
          } catch {
            // If AI fails, mark as uncategorised with low confidence
            return batch.map((tx) => ({
              id: tx.id,
              category: 'personal' as const,
              confidence: 0.0,
              incomeSourceType: null,
              reasoning: 'AI categorisation unavailable — defaulted to personal',
            }));
          }
        }),
      );
      for (const batchResult of chunkResults) {
        results.push(...batchResult);
      }
    }
  }

  return results;
}
