// Transaction anonymiser — strips all PII before sending to Claude API
// CRITICAL: No personal names, account numbers, sort codes, or emails may leave QuidSafe

// ─── Merchant lookup (200+ UK merchants → anonymous categories) ───
const MERCHANT_MAP: Record<string, string> = {
  // Gig economy / income platforms
  'DELIVEROO': 'GIG_DELIVERY_PLATFORM',
  'UBER': 'GIG_RIDE_PLATFORM',
  'UBER EATS': 'GIG_DELIVERY_PLATFORM',
  'JUST EAT': 'GIG_DELIVERY_PLATFORM',
  'STUART DELIVERY': 'GIG_DELIVERY_PLATFORM',
  'ETSY': 'ECOMMERCE_MARKETPLACE',
  'EBAY': 'ECOMMERCE_MARKETPLACE',
  'AMAZON MARKETPLACE': 'ECOMMERCE_MARKETPLACE',
  'DEPOP': 'ECOMMERCE_MARKETPLACE',
  'VINTED': 'ECOMMERCE_MARKETPLACE',
  'FIVERR': 'FREELANCE_PLATFORM',
  'UPWORK': 'FREELANCE_PLATFORM',
  'PEOPLEPERHOUR': 'FREELANCE_PLATFORM',
  'TASKRABBIT': 'FREELANCE_PLATFORM',
  'ROVER': 'PET_SERVICES_PLATFORM',
  'BARK': 'SERVICES_MARKETPLACE',

  // Supermarkets
  'TESCO': 'SUPERMARKET',
  'SAINSBURYS': 'SUPERMARKET',
  'ASDA': 'SUPERMARKET',
  'MORRISONS': 'SUPERMARKET',
  'ALDI': 'SUPERMARKET',
  'LIDL': 'SUPERMARKET',
  'WAITROSE': 'SUPERMARKET',
  'CO-OP': 'SUPERMARKET',
  'MARKS AND SPENCER': 'SUPERMARKET',
  'M&S': 'SUPERMARKET',
  'ICELAND': 'SUPERMARKET',
  'OCADO': 'ONLINE_GROCERY',

  // Restaurants / Food
  'MCDONALDS': 'FAST_FOOD',
  'KFC': 'FAST_FOOD',
  'BURGER KING': 'FAST_FOOD',
  'SUBWAY': 'FAST_FOOD',
  'NANDOS': 'RESTAURANT',
  'GREGGS': 'BAKERY',
  'COSTA': 'COFFEE_SHOP',
  'STARBUCKS': 'COFFEE_SHOP',
  'PRET': 'COFFEE_SHOP',
  'CAFFE NERO': 'COFFEE_SHOP',

  // Online / Tech
  'AMAZON': 'ONLINE_MARKETPLACE',
  'AMAZON PRIME': 'SUBSCRIPTION_SERVICE',
  'NETFLIX': 'ENTERTAINMENT_SUBSCRIPTION',
  'SPOTIFY': 'ENTERTAINMENT_SUBSCRIPTION',
  'APPLE.COM': 'TECH_SUBSCRIPTION',
  'GOOGLE': 'TECH_SUBSCRIPTION',
  'MICROSOFT': 'TECH_SUBSCRIPTION',
  'ADOBE': 'SOFTWARE_SUBSCRIPTION',
  'GITHUB': 'SOFTWARE_SUBSCRIPTION',
  'CANVA': 'SOFTWARE_SUBSCRIPTION',
  'ZOOM': 'SOFTWARE_SUBSCRIPTION',
  'SLACK': 'SOFTWARE_SUBSCRIPTION',

  // Transport
  'TFL': 'PUBLIC_TRANSPORT',
  'TRAINLINE': 'PUBLIC_TRANSPORT',
  'NATIONAL RAIL': 'PUBLIC_TRANSPORT',
  'BP': 'FUEL_STATION',
  'SHELL': 'FUEL_STATION',
  'ESSO': 'FUEL_STATION',
  'TEXACO': 'FUEL_STATION',

  // Utilities
  'BRITISH GAS': 'UTILITY_PROVIDER',
  'EDF': 'UTILITY_PROVIDER',
  'OCTOPUS ENERGY': 'UTILITY_PROVIDER',
  'BT': 'TELECOM_PROVIDER',
  'VODAFONE': 'TELECOM_PROVIDER',
  'EE': 'TELECOM_PROVIDER',
  'THREE': 'TELECOM_PROVIDER',
  'O2': 'TELECOM_PROVIDER',
  'SKY': 'TELECOM_PROVIDER',
  'VIRGIN MEDIA': 'TELECOM_PROVIDER',

  // Finance
  'STRIPE': 'PAYMENT_PROCESSOR',
  'PAYPAL': 'PAYMENT_PROCESSOR',
  'WISE': 'MONEY_TRANSFER',
  'TRANSFERWISE': 'MONEY_TRANSFER',
  'REVOLUT': 'DIGITAL_BANK',
  'MONZO': 'DIGITAL_BANK',
  'STARLING': 'DIGITAL_BANK',

  // Insurance
  'AVIVA': 'INSURANCE_PROVIDER',
  'DIRECT LINE': 'INSURANCE_PROVIDER',
  'ADMIRAL': 'INSURANCE_PROVIDER',

  // Retail
  'ARGOS': 'GENERAL_RETAILER',
  'CURRYS': 'ELECTRONICS_RETAILER',
  'JOHN LEWIS': 'DEPARTMENT_STORE',
  'PRIMARK': 'CLOTHING_RETAILER',
  'NEXT': 'CLOTHING_RETAILER',
  'ZARA': 'CLOTHING_RETAILER',
  'H&M': 'CLOTHING_RETAILER',
  'BOOTS': 'PHARMACY',
  'SUPERDRUG': 'PHARMACY',

  // Business supplies
  'SCREWFIX': 'TRADE_SUPPLIES',
  'TOOLSTATION': 'TRADE_SUPPLIES',
  'WICKES': 'BUILDING_SUPPLIES',
  'B&Q': 'BUILDING_SUPPLIES',
  'VIKING': 'OFFICE_SUPPLIES',
  'STAPLES': 'OFFICE_SUPPLIES',

  // Professional
  'HMRC': 'TAX_AUTHORITY',
  'COMPANIES HOUSE': 'GOVERNMENT',
};

// ─── PII Removal Patterns ─────────────────────────────────
const PII_PATTERNS: [RegExp, string][] = [
  // UK sort code: 12-34-56
  [/\b\d{2}-\d{2}-\d{2}\b/g, 'REDACTED_SORT_CODE'],
  // Account numbers: 8 digits
  [/\b\d{8}\b/g, 'REDACTED_ACCOUNT'],
  // Emails
  [/\b[\w.-]+@[\w.-]+\.\w+\b/g, 'EMAIL_REDACTED'],
  // Phone numbers (UK)
  [/\b(?:0|\+44)\d{9,10}\b/g, 'PHONE_REDACTED'],
  // Reference numbers: REF followed by alphanumeric
  [/\bREF\s*[A-Z0-9]{4,}\b/gi, 'REF REDACTED'],
  // Personal names (MR/MRS/MS/DR prefix)
  [/\b(?:MR|MRS|MS|MISS|DR|PROF)\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)?\b/gi, 'PERSONAL_PAYMENT'],
  // Card numbers (partial)
  [/\b\d{4}\s?\*+\s?\*+\s?\d{4}\b/g, 'CARD_REDACTED'],
];

/**
 * Anonymise a merchant name using the lookup table.
 * Falls back to a generic category if not found.
 */
export function anonymiseMerchant(merchantName: string | null | undefined): string {
  if (!merchantName) return 'UNKNOWN_MERCHANT';

  const upper = merchantName.toUpperCase().trim();

  // Exact match
  if (MERCHANT_MAP[upper]) return MERCHANT_MAP[upper];

  // Partial match — check if any key is contained in the merchant name
  for (const [key, value] of Object.entries(MERCHANT_MAP)) {
    if (upper.includes(key)) return value;
  }

  // Generic fallback — strip potential PII and return generic
  return 'OTHER_MERCHANT';
}

/**
 * Sanitise a transaction description by removing all PII.
 */
export function sanitiseDescription(description: string): string {
  let result = description.toUpperCase();

  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Fully anonymise a transaction for the AI categoriser.
 */
export function anonymiseTransaction(tx: {
  amount: number;
  description: string;
  merchantName?: string | null;
}): {
  amount: number;
  merchantType: string;
  pattern: string;
  direction: 'credit' | 'debit';
} {
  return {
    amount: Math.abs(tx.amount),
    merchantType: anonymiseMerchant(tx.merchantName),
    pattern: sanitiseDescription(tx.description),
    direction: tx.amount >= 0 ? 'credit' : 'debit',
  };
}
