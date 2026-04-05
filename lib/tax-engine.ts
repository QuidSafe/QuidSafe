// QuidSafe UK Tax Engine — Pure functions for 2026/27 tax year
// Source: HMRC rates — see docs/TAX_RULES.md

// 2026/27 Tax Year Thresholds & Rates
const TAX_YEAR = '2026/27';

const PERSONAL_ALLOWANCE = 12_570;
const BASIC_RATE_THRESHOLD = 50_270;
const HIGHER_RATE_THRESHOLD = 125_140;

const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

// Personal allowance taper: reduced by £1 for every £2 over £100,000
const TAPER_THRESHOLD = 100_000;

// National Insurance Class 2 & 4 (2026/27)
const NI_CLASS2_WEEKLY = 3.45;
const NI_CLASS2_SMALL_PROFITS_THRESHOLD = 6_725;
const NI_CLASS4_LOWER_PROFITS = 12_570;
const NI_CLASS4_UPPER_PROFITS = 50_270;
const NI_CLASS4_MAIN_RATE = 0.06;
const NI_CLASS4_ADDITIONAL_RATE = 0.02;

export interface TaxInput {
  totalIncome: number;
  totalExpenses: number;
  quarter?: number;
}

export interface TaxResult {
  taxYear: string;
  quarter: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  personalAllowance: number;
  incomeTax: number;
  niClass2: number;
  niClass4: number;
  totalTaxOwed: number;
  setAsideMonthly: number;
  effectiveRate: number;
  plainEnglish: string;
}

function calculatePersonalAllowance(income: number): number {
  if (income <= TAPER_THRESHOLD) return PERSONAL_ALLOWANCE;
  const reduction = Math.floor((income - TAPER_THRESHOLD) / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  // Basic rate band (up to £37,700 of taxable income)
  const basicBand = BASIC_RATE_THRESHOLD - PERSONAL_ALLOWANCE;
  const basicAmount = Math.min(remaining, basicBand);
  tax += basicAmount * BASIC_RATE;
  remaining -= basicAmount;

  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Higher rate band
  const higherBand = HIGHER_RATE_THRESHOLD - BASIC_RATE_THRESHOLD;
  const higherAmount = Math.min(remaining, higherBand);
  tax += higherAmount * HIGHER_RATE;
  remaining -= higherAmount;

  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Additional rate
  tax += remaining * ADDITIONAL_RATE;

  return Math.round(tax * 100) / 100;
}

function calculateNIClass2(profit: number): number {
  if (profit < NI_CLASS2_SMALL_PROFITS_THRESHOLD) return 0;
  return Math.round(NI_CLASS2_WEEKLY * 52 * 100) / 100;
}

function calculateNIClass4(profit: number): number {
  if (profit <= NI_CLASS4_LOWER_PROFITS) return 0;

  let ni = 0;

  const mainBand = Math.min(profit, NI_CLASS4_UPPER_PROFITS) - NI_CLASS4_LOWER_PROFITS;
  ni += Math.max(0, mainBand) * NI_CLASS4_MAIN_RATE;

  if (profit > NI_CLASS4_UPPER_PROFITS) {
    ni += (profit - NI_CLASS4_UPPER_PROFITS) * NI_CLASS4_ADDITIONAL_RATE;
  }

  return Math.round(ni * 100) / 100;
}

function generatePlainEnglish(result: Omit<TaxResult, 'plainEnglish'>): string {
  const { totalIncome, totalExpenses, totalTaxOwed, setAsideMonthly, effectiveRate } = result;

  if (totalIncome === 0) {
    return "You haven't recorded any income yet. Once you start adding income, we'll calculate your tax.";
  }

  if (totalTaxOwed === 0) {
    return `Your profit of £${(totalIncome - totalExpenses).toLocaleString()} is within your personal allowance. No tax due yet!`;
  }

  return `On £${totalIncome.toLocaleString()} income with £${totalExpenses.toLocaleString()} expenses, you'll owe approximately £${totalTaxOwed.toLocaleString()} in tax and National Insurance (${effectiveRate}% effective rate). Set aside £${setAsideMonthly.toLocaleString()} per month to stay on track.`;
}

export function calculateTax(input: TaxInput): TaxResult {
  const { totalIncome, totalExpenses, quarter = 0 } = input;

  const profit = Math.max(0, totalIncome - totalExpenses);
  const personalAllowance = calculatePersonalAllowance(profit);
  const taxableIncome = Math.max(0, profit - personalAllowance);

  const incomeTax = calculateIncomeTax(taxableIncome);
  const niClass2 = calculateNIClass2(profit);
  const niClass4 = calculateNIClass4(profit);
  const totalTaxOwed = Math.round((incomeTax + niClass2 + niClass4) * 100) / 100;

  const monthsRemaining = quarter > 0 ? Math.max(1, 12 - (quarter - 1) * 3) : 12;
  const setAsideMonthly = totalTaxOwed > 0 ? Math.round((totalTaxOwed / monthsRemaining) * 100) / 100 : 0;

  const effectiveRate = profit > 0 ? Math.round((totalTaxOwed / profit) * 10000) / 100 : 0;

  const partialResult = {
    taxYear: TAX_YEAR,
    quarter,
    totalIncome,
    totalExpenses,
    taxableIncome,
    personalAllowance,
    incomeTax,
    niClass2,
    niClass4,
    totalTaxOwed,
    setAsideMonthly,
    effectiveRate,
  };

  return {
    ...partialResult,
    plainEnglish: generatePlainEnglish(partialResult),
  };
}

export function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
