// QuidSafe UK Tax Engine — Pure functions, config-driven rates
// Source: HMRC rates — see docs/TAX_RULES.md

// ─── Tax Year Config ──────────────────────────────────────

export interface TaxYearConfig {
  year: string;
  personalAllowance: number;
  basicRateThreshold: number;
  higherRateThreshold: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
  taperThreshold: number;
  niClass2WeeklyRate: number;
  niClass2SmallProfitsThreshold: number;
  niClass4LowerLimit: number;
  niClass4UpperLimit: number;
  niClass4MainRate: number;
  niClass4AdditionalRate: number;
}

export const TAX_YEARS: Record<string, TaxYearConfig> = {
  '2025/26': {
    year: '2025/26',
    personalAllowance: 12_570,
    basicRateThreshold: 50_270,
    higherRateThreshold: 125_140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    taperThreshold: 100_000,
    niClass2WeeklyRate: 3.45,
    niClass2SmallProfitsThreshold: 6_725,
    niClass4LowerLimit: 12_570,
    niClass4UpperLimit: 50_270,
    niClass4MainRate: 0.06,
    niClass4AdditionalRate: 0.02,
  },
  '2026/27': {
    year: '2026/27',
    personalAllowance: 12_570,
    basicRateThreshold: 50_270,
    higherRateThreshold: 125_140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    taperThreshold: 100_000,
    niClass2WeeklyRate: 3.45,
    niClass2SmallProfitsThreshold: 6_725,
    niClass4LowerLimit: 12_570,
    niClass4UpperLimit: 50_270,
    niClass4MainRate: 0.06,
    niClass4AdditionalRate: 0.02,
  },
};

const DEFAULT_TAX_YEAR = '2026/27';

function getConfig(taxYear?: string): TaxYearConfig {
  const key = taxYear ?? DEFAULT_TAX_YEAR;
  const config = TAX_YEARS[key];
  if (!config) throw new Error(`Unknown tax year: ${key}`);
  return config;
}

// ─── Types ────────────────────────────────────────────────

export interface TaxInput {
  totalIncome: number;
  totalExpenses: number;
  quarter?: number;
  taxYear?: string;
  monthsTrading?: number; // For partial tax years (1-12). Prorates thresholds.
}

export interface IncomeTaxBreakdown {
  basicRate: number;
  higherRate: number;
  additionalRate: number;
  total: number;
}

export interface NIBreakdown {
  class2: number;
  class4: number;
  total: number;
}

export interface TaxResult {
  taxYear: string;
  quarter: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTax: IncomeTaxBreakdown;
  nationalInsurance: NIBreakdown;
  totalTaxOwed: number;
  setAsideMonthly: number;
  effectiveRate: number;
  plainEnglish: string;
}

// Prompt 06 compatible type alias
export interface FullTaxResult {
  taxYear: string;
  grossIncome: number;
  allowableExpenses: number;
  netProfit: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTax: IncomeTaxBreakdown;
  nationalInsurance: NIBreakdown;
  totalTaxOwed: number;
  effectiveRate: number;
  setAsideMonthly: number;
  plainEnglish: string;
}

export interface QuarterInfo {
  quarter: number;
  startDate: string;
  endDate: string;
  deadline: string;
  income: number;
  expenses: number;
  tax: number;
}

// ─── Calculation Functions ────────────────────────────────

export function calculatePersonalAllowance(income: number, config: TaxYearConfig): number {
  if (income <= config.taperThreshold) return config.personalAllowance;
  const reduction = Math.floor((income - config.taperThreshold) / 2);
  return Math.max(0, config.personalAllowance - reduction);
}

export function calculateIncomeTax(taxableIncome: number, config: TaxYearConfig): IncomeTaxBreakdown {
  if (taxableIncome <= 0) return { basicRate: 0, higherRate: 0, additionalRate: 0, total: 0 };

  let remaining = taxableIncome;

  // Basic rate band
  const basicBand = config.basicRateThreshold - config.personalAllowance;
  const basicAmount = Math.min(remaining, basicBand);
  const basicTax = round(basicAmount * config.basicRate);
  remaining -= basicAmount;

  // Higher rate band
  const higherBand = config.higherRateThreshold - config.basicRateThreshold;
  const higherAmount = Math.min(Math.max(remaining, 0), higherBand);
  const higherTax = round(higherAmount * config.higherRate);
  remaining -= higherAmount;

  // Additional rate
  const additionalTax = round(Math.max(remaining, 0) * config.additionalRate);

  return {
    basicRate: basicTax,
    higherRate: higherTax,
    additionalRate: additionalTax,
    total: round(basicTax + higherTax + additionalTax),
  };
}

export function calculateNIClass2(profit: number, config: TaxYearConfig): number {
  if (profit < config.niClass2SmallProfitsThreshold) return 0;
  return round(config.niClass2WeeklyRate * 52);
}

export function calculateNIClass4(profit: number, config: TaxYearConfig): number {
  if (profit <= config.niClass4LowerLimit) return 0;

  const mainBand = Math.min(profit, config.niClass4UpperLimit) - config.niClass4LowerLimit;
  let ni = Math.max(0, mainBand) * config.niClass4MainRate;

  if (profit > config.niClass4UpperLimit) {
    ni += (profit - config.niClass4UpperLimit) * config.niClass4AdditionalRate;
  }

  return round(ni);
}

export function calculateNI(profit: number, config: TaxYearConfig): NIBreakdown {
  const class2 = calculateNIClass2(profit, config);
  const class4 = calculateNIClass4(profit, config);
  return { class2, class4, total: round(class2 + class4) };
}

// ─── Plain English Generator ──────────────────────────────

function generatePlainEnglish(result: Omit<TaxResult, 'plainEnglish'>): string {
  const { totalIncome, totalExpenses, totalTaxOwed, setAsideMonthly, effectiveRate, netProfit, personalAllowance, quarter } = result;

  if (totalIncome === 0) {
    return "You haven't recorded any income yet. Once you start adding income, we'll calculate your tax.";
  }

  if (totalTaxOwed === 0) {
    return `Good news — your profit of ${formatCurrency(netProfit)} is within your £${personalAllowance.toLocaleString()} personal allowance. No tax owed yet!`;
  }

  if (netProfit > 100_000) {
    return `Heads up — at ${formatCurrency(totalIncome)} income, your personal allowance is being tapered. You'll owe approximately ${formatCurrency(totalTaxOwed)} (${effectiveRate}% effective rate). Set aside ${formatCurrency(setAsideMonthly)} per month.`;
  }

  // Approaching higher rate threshold warning
  if (netProfit > 40_000 && netProfit <= 50_270) {
    return `Heads up — you're approaching the higher rate threshold. You've earned ${formatCurrency(totalIncome)} with ${formatCurrency(totalExpenses)} in expenses. Set aside ${formatCurrency(setAsideMonthly)} per month. Total tax: ${formatCurrency(totalTaxOwed)} (${effectiveRate}% effective rate).`;
  }

  // Quarter-specific message
  if (quarter && quarter > 0) {
    return `Based on Q${quarter}, you should set aside ${formatCurrency(setAsideMonthly)} per month. Total tax so far: ${formatCurrency(totalTaxOwed)} on ${formatCurrency(totalIncome)} income (${effectiveRate}% effective rate).`;
  }

  return `You've earned ${formatCurrency(totalIncome)} with ${formatCurrency(totalExpenses)} in expenses. Set aside ${formatCurrency(setAsideMonthly)} per month and you're covered. Total tax: ${formatCurrency(totalTaxOwed)} (${effectiveRate}% effective rate).`;
}

// ─── Main Entry Point ─────────────────────────────────────

export function calculateTax(input: TaxInput): TaxResult {
  const config = getConfig(input.taxYear);
  const { totalIncome, totalExpenses, quarter = 0, monthsTrading } = input;

  const netProfit = Math.max(0, totalIncome - totalExpenses);
  const personalAllowance = calculatePersonalAllowance(netProfit, config);
  const taxableIncome = Math.max(0, netProfit - personalAllowance);

  const incomeTax = calculateIncomeTax(taxableIncome, config);
  const nationalInsurance = calculateNI(netProfit, config);
  const totalTaxOwed = round(incomeTax.total + nationalInsurance.total);

  // For partial tax years, use monthsTrading for set-aside spread
  const monthsRemaining = monthsTrading
    ? Math.max(1, monthsTrading)
    : quarter > 0 ? Math.max(1, 12 - (quarter - 1) * 3) : 12;
  const setAsideMonthly = totalTaxOwed > 0 ? round(totalTaxOwed / monthsRemaining) : 0;

  const effectiveRate = netProfit > 0 ? round((totalTaxOwed / netProfit) * 100) / 1 : 0;

  const partialResult: Omit<TaxResult, 'plainEnglish'> = {
    taxYear: config.year,
    quarter,
    totalIncome,
    totalExpenses,
    netProfit,
    personalAllowance,
    taxableIncome,
    incomeTax,
    nationalInsurance,
    totalTaxOwed,
    setAsideMonthly,
    effectiveRate,
  };

  return {
    ...partialResult,
    plainEnglish: generatePlainEnglish(partialResult),
  };
}

// ─── Quarterly Breakdown ──────────────────────────────────

/**
 * Get UK tax quarter info for a given tax year.
 * UK tax year: 6 Apr – 5 Apr
 * Q1: Apr–Jun, Q2: Jul–Sep, Q3: Oct–Dec, Q4: Jan–Mar
 */
export function getQuarterDates(taxYear: string): QuarterInfo[] {
  const startYear = parseInt(taxYear.split('/')[0], 10);

  return [
    { quarter: 1, startDate: `${startYear}-04-06`, endDate: `${startYear}-07-05`, deadline: `${startYear}-08-05`, income: 0, expenses: 0, tax: 0 },
    { quarter: 2, startDate: `${startYear}-07-06`, endDate: `${startYear}-10-05`, deadline: `${startYear}-11-05`, income: 0, expenses: 0, tax: 0 },
    { quarter: 3, startDate: `${startYear}-10-06`, endDate: `${startYear + 1}-01-05`, deadline: `${startYear + 1}-02-05`, income: 0, expenses: 0, tax: 0 },
    { quarter: 4, startDate: `${startYear + 1}-01-06`, endDate: `${startYear + 1}-04-05`, deadline: `${startYear + 1}-05-05`, income: 0, expenses: 0, tax: 0 },
  ];
}

/**
 * Determine the current UK tax quarter based on a date.
 */
export function getCurrentQuarter(date: Date = new Date()): { taxYear: string; quarter: number } {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  // Tax year starts 6 April
  if (month < 4 || (month === 4 && day < 6)) {
    // Jan 6 – Apr 5 = Q4 of previous tax year
    if (month > 1 || (month === 1 && day >= 6)) {
      return { taxYear: `${year - 1}/${(year % 100).toString().padStart(2, '0')}`, quarter: 4 };
    }
    // Jan 1-5 = Q3 of previous tax year
    return { taxYear: `${year - 1}/${(year % 100).toString().padStart(2, '0')}`, quarter: 3 };
  }

  const taxYear = `${year}/${((year + 1) % 100).toString().padStart(2, '0')}`;

  if (month < 7 || (month === 7 && day < 6)) return { taxYear, quarter: 1 };
  if (month < 10 || (month === 10 && day < 6)) return { taxYear, quarter: 2 };
  return { taxYear, quarter: 3 };
}

// ─── Utilities ────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Standalone Set-Aside Calculator ─────────────────────

export function calculateSetAsideMonthly(totalTax: number, monthsRemaining: number): number {
  if (totalTax <= 0 || monthsRemaining <= 0) return 0;
  return round(totalTax / Math.max(1, monthsRemaining));
}

// ─── Facade Functions (Prompt 06 signatures) ─────────────

/**
 * Calculate income tax from gross income for a tax year.
 * Handles PA deduction internally.
 */
export function calculateIncomeTaxFromGross(grossIncome: number, taxYear: string): IncomeTaxBreakdown {
  const config = getConfig(taxYear);
  const pa = calculatePersonalAllowance(grossIncome, config);
  const taxableIncome = Math.max(0, grossIncome - pa);
  return calculateIncomeTax(taxableIncome, config);
}

/**
 * Calculate National Insurance from gross profit for a tax year.
 */
export function calculateNationalInsurance(grossProfit: number, taxYear: string): NIBreakdown {
  const config = getConfig(taxYear);
  return calculateNI(grossProfit, config);
}

/**
 * Calculate total tax from gross income and expenses for a tax year.
 * Returns the full FullTaxResult with all breakdowns.
 */
export function calculateTotalTax(grossIncome: number, allowableExpenses: number, taxYear: string): FullTaxResult {
  const result = calculateTax({ totalIncome: grossIncome, totalExpenses: allowableExpenses, taxYear });
  return {
    taxYear: result.taxYear,
    grossIncome: result.totalIncome,
    allowableExpenses: result.totalExpenses,
    netProfit: result.netProfit,
    personalAllowance: result.personalAllowance,
    taxableIncome: result.taxableIncome,
    incomeTax: result.incomeTax,
    nationalInsurance: result.nationalInsurance,
    totalTaxOwed: result.totalTaxOwed,
    effectiveRate: result.effectiveRate,
    setAsideMonthly: result.setAsideMonthly,
    plainEnglish: result.plainEnglish,
  };
}
