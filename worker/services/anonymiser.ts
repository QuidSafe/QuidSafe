// Transaction anonymiser - strips all PII before sending to Claude API
// CRITICAL: No personal names, account numbers, sort codes, or emails may leave QuidSafe

// ─── Merchant lookup (200+ UK merchants -> anonymous categories) ───
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

  // Gig economy / income platforms (additional)
  'GOPUFF': 'GIG_DELIVERY_PLATFORM',
  'ZAPP': 'GIG_DELIVERY_PLATFORM',
  'GORILLAS': 'GIG_DELIVERY_PLATFORM',
  'GETIR': 'GIG_DELIVERY_PLATFORM',
  'BOLT': 'GIG_RIDE_PLATFORM',
  'FREEAGENT': 'FREELANCE_PLATFORM',
  'SHOPIFY': 'ECOMMERCE_PLATFORM',
  'AMAZON FLEX': 'GIG_DELIVERY_PLATFORM',

  // Supermarkets / Convenience (additional)
  'SPAR': 'CONVENIENCE_STORE',
  'NISA': 'CONVENIENCE_STORE',
  'BUDGENS': 'CONVENIENCE_STORE',
  'COSTCUTTER': 'CONVENIENCE_STORE',
  'ONE STOP': 'CONVENIENCE_STORE',
  'PREMIER': 'CONVENIENCE_STORE',
  'LONDIS': 'CONVENIENCE_STORE',
  'FARMFOODS': 'SUPERMARKET',
  'JACKS': 'SUPERMARKET',
  'HOME BARGAINS': 'DISCOUNT_RETAILER',
  'POUNDLAND': 'DISCOUNT_RETAILER',
  'POUNDSTRETCHER': 'DISCOUNT_RETAILER',
  'B&M': 'DISCOUNT_RETAILER',
  'THE RANGE': 'DISCOUNT_RETAILER',

  // Restaurants / Food (additional)
  'WAGAMAMA': 'RESTAURANT',
  'PIZZA EXPRESS': 'RESTAURANT',
  'PIZZA HUT': 'FAST_FOOD',
  'DOMINOS': 'FAST_FOOD',
  'PAPA JOHNS': 'FAST_FOOD',
  'FIVE GUYS': 'FAST_FOOD',
  'LEON': 'FAST_FOOD',
  'ITSU': 'FAST_FOOD',
  'WASABI': 'FAST_FOOD',
  'DISHOOM': 'RESTAURANT',
  'TOBY CARVERY': 'RESTAURANT',
  'HARVESTER': 'RESTAURANT',
  'MILLER AND CARTER': 'RESTAURANT',
  'WETHERSPOONS': 'PUB_RESTAURANT',
  'YO SUSHI': 'RESTAURANT',

  // Coffee (additional)
  'COFFEE #1': 'COFFEE_SHOP',
  'BLACK SHEEP COFFEE': 'COFFEE_SHOP',

  // Transport (additional)
  'NATIONAL EXPRESS': 'PUBLIC_TRANSPORT',
  'MEGABUS': 'PUBLIC_TRANSPORT',
  'FLIXBUS': 'PUBLIC_TRANSPORT',
  'RAC': 'MOTORING_SERVICE',
  'AA': 'MOTORING_SERVICE',
  'HALFORDS': 'MOTORING_RETAILER',
  'KWIK FIT': 'MOTORING_SERVICE',
  'EUROCAR PARKS': 'PARKING',
  'Q-PARK': 'PARKING',
  'JUST PARK': 'PARKING',
  'RINGGO': 'PARKING',

  // Utilities (additional)
  'BULB': 'UTILITY_PROVIDER',
  'SSE': 'UTILITY_PROVIDER',
  'SCOTTISH POWER': 'UTILITY_PROVIDER',
  'THAMES WATER': 'UTILITY_PROVIDER',
  'UNITED UTILITIES': 'UTILITY_PROVIDER',
  'SEVERN TRENT': 'UTILITY_PROVIDER',
  'ANGLIAN WATER': 'UTILITY_PROVIDER',
  'TV LICENSING': 'UTILITY_PROVIDER',

  // Telecoms (additional)
  'GIFFGAFF': 'TELECOM_PROVIDER',
  'TESCO MOBILE': 'TELECOM_PROVIDER',
  'TALKTALK': 'TELECOM_PROVIDER',
  'PLUSNET': 'TELECOM_PROVIDER',
  'HYPEROPTIC': 'TELECOM_PROVIDER',
  'ZEN INTERNET': 'TELECOM_PROVIDER',

  // Entertainment (additional)
  'DISNEY PLUS': 'ENTERTAINMENT_SUBSCRIPTION',
  'APPLE TV': 'ENTERTAINMENT_SUBSCRIPTION',
  'NOW TV': 'ENTERTAINMENT_SUBSCRIPTION',
  'PARAMOUNT PLUS': 'ENTERTAINMENT_SUBSCRIPTION',
  'YOUTUBE PREMIUM': 'ENTERTAINMENT_SUBSCRIPTION',
  'DAZN': 'ENTERTAINMENT_SUBSCRIPTION',
  'AUDIBLE': 'ENTERTAINMENT_SUBSCRIPTION',
  'KINDLE': 'ENTERTAINMENT_SUBSCRIPTION',
  'XBOX': 'GAMING_SUBSCRIPTION',
  'PLAYSTATION': 'GAMING_SUBSCRIPTION',
  'NINTENDO': 'GAMING_SUBSCRIPTION',
  'STEAM': 'GAMING_SUBSCRIPTION',
  'TWITCH': 'ENTERTAINMENT_SUBSCRIPTION',
  'PATREON': 'ENTERTAINMENT_SUBSCRIPTION',

  // Insurance (additional)
  'MORE THAN': 'INSURANCE_PROVIDER',
  'COMPARETHEMARKET': 'INSURANCE_COMPARISON',
  'GOCOMPARE': 'INSURANCE_COMPARISON',
  'MONEYSUPERMARKET': 'INSURANCE_COMPARISON',
  'CHURCHILL': 'INSURANCE_PROVIDER',
  'ZURICH': 'INSURANCE_PROVIDER',
  'AXA': 'INSURANCE_PROVIDER',
  'LV': 'INSURANCE_PROVIDER',
  'HASTINGS DIRECT': 'INSURANCE_PROVIDER',

  // Banking / Finance (additional)
  'NATIONWIDE': 'HIGH_STREET_BANK',
  'HALIFAX': 'HIGH_STREET_BANK',
  'BARCLAYS': 'HIGH_STREET_BANK',
  'LLOYDS': 'HIGH_STREET_BANK',
  'SANTANDER': 'HIGH_STREET_BANK',
  'CHASE': 'DIGITAL_BANK',
  'CURVE': 'PAYMENT_PROCESSOR',
  'SQUARE': 'PAYMENT_PROCESSOR',
  'SUMUP': 'PAYMENT_PROCESSOR',
  'TIDE': 'DIGITAL_BANK',
  'COCONUT': 'DIGITAL_BANK',

  // Retail (additional)
  'WILKO': 'GENERAL_RETAILER',
  'TK MAXX': 'CLOTHING_RETAILER',
  'SPORTS DIRECT': 'SPORTS_RETAILER',
  'JD SPORTS': 'SPORTS_RETAILER',
  'DECATHLON': 'SPORTS_RETAILER',
  'IKEA': 'HOME_RETAILER',
  'DUNELM': 'HOME_RETAILER',
  'THE WORKS': 'GENERAL_RETAILER',
  'HOBBYCRAFT': 'GENERAL_RETAILER',
  'RYMAN': 'OFFICE_SUPPLIES',
  'WHSMITH': 'GENERAL_RETAILER',

  // Professional (additional)
  'HMRC': 'TAX_AUTHORITY',
  'COMPANIES HOUSE': 'GOVERNMENT',
  'XERO': 'ACCOUNTING_SOFTWARE',
  'QUICKBOOKS': 'ACCOUNTING_SOFTWARE',
  'SAGE': 'ACCOUNTING_SOFTWARE',
  'TAXASSIST': 'ACCOUNTING_SERVICE',
  'ICO': 'GOVERNMENT',

  // Health
  'SPECSAVERS': 'HEALTH_SERVICE',
  'VISION EXPRESS': 'HEALTH_SERVICE',
  'DENTIST': 'HEALTH_SERVICE',
  'BUPA': 'HEALTH_SERVICE',
  'NUFFIELD': 'HEALTH_SERVICE',

  // Home / Garden (additional)
  'HOMEBASE': 'BUILDING_SUPPLIES',
  'ROBERT DYAS': 'HOME_RETAILER',
  'PLUMB CENTER': 'TRADE_SUPPLIES',

  // Education
  'UDEMY': 'EDUCATION_PLATFORM',
  'COURSERA': 'EDUCATION_PLATFORM',
  'SKILLSHARE': 'EDUCATION_PLATFORM',
  'LINKEDIN LEARNING': 'EDUCATION_PLATFORM',
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
  // Bank transfer/payment narratives followed by names
  // FPS CREDIT JOHN SMITH, PAYMENT FROM SARAH JONES, TFR JAMES WILSON, etc.
  [/\b(?:FPS\s+CREDIT|PAYMENT\s+FROM|PAYMENT\s+TO|TFR|TRANSFER\s+FROM|TRANSFER\s+TO|FROM|TO)\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){0,3}\b/gi, 'PERSONAL_PAYMENT'],
  // Postcodes (UK): SW1A 1AA, M1 1AA, etc.
  [/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi, 'POSTCODE_REDACTED'],
  // National Insurance numbers: AB123456C
  [/\b[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]\b/g, 'NINO_REDACTED'],
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

  // Partial match - check if any key is contained in the merchant name
  for (const [key, value] of Object.entries(MERCHANT_MAP)) {
    if (upper.includes(key)) return value;
  }

  // Generic fallback - strip potential PII and return generic
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
